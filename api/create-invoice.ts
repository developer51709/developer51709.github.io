import type { VercelRequest, VercelResponse } from '@vercel/node';

const OXAPAY_INVOICE_URL = 'https://api.oxapay.com/v1/payment/invoice';

// Simple in-memory rate limit per IP (per serverless instance — enough to stop casual abuse).
const hits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — the frontend may be served from a different domain than the API.
  const origin = req.headers.origin as string | undefined;
  const allowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
    : '*';
  if (allowed !== '*' && origin && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  // Never pass undefined to setHeader — same-origin requests may omit Origin.
  const corsOrigin =
    allowed === '*' ? '*' : origin && allowed.includes(origin) ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OXAPAY_MERCHANT_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'OXAPAY_MERCHANT_API_KEY is not configured' });
  }

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0] ||
    'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { amount, currency, email, description } = req.body ?? {};

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: 'A positive `amount` is required' });
  }

  if (typeof fetch !== 'function') {
    return res.status(500).json({
      error:
        'Server runtime is too old (needs Node 18+ for fetch). Set the Node.js version in Vercel project settings.',
    });
  }

  try {
    const response = await fetch(OXAPAY_INVOICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // OxaPay v1 authenticates via the `merchant_api_key` header.
        merchant_api_key: apiKey,
      },
      body: JSON.stringify({
        amount: amountNum,
        ...(currency ? { currency: String(currency) } : {}),
        ...(email ? { email: String(email) } : {}),
        description:
          (description as string) || 'Sponsorship / donation via portfolio',
        sandbox: process.env.OXAPAY_SANDBOX === 'true',
      }),
    });

    // OxaPay may return plain text on gateway errors — never assume JSON.
    const raw = await response.text();
    let data: {
      status?: number;
      message?: string;
      data?: { payment_url?: string; track_id?: string };
      error?: { message?: string };
    } | null = null;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('OxaPay returned non-JSON response:', raw.slice(0, 300));
    }

    if (!response.ok || !data?.data?.payment_url) {
      return res.status(response.ok ? 502 : response.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          `Failed to create OxaPay invoice (HTTP ${response.status})`,
      });
    }

    return res.status(200).json({
      paymentUrl: data.data.payment_url,
      trackId: data.data.track_id,
    });
  } catch (err) {
    console.error('OxaPay invoice error:', err);
    return res.status(502).json({ error: 'Payment gateway is unavailable' });
  }
}
