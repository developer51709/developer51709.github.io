import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

// In-memory caches: access tokens and display names are stable for hours.
const tokenCache: { token: string | null; expiresAt: number } = {
  token: null,
  expiresAt: 0,
};
const nameCache = new Map<string, { name: string | null; expires: number }>();
const NAME_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`,
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    console.error('Spotify token request failed:', res.status);
    return null;
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return tokenCache.token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (same hardened pattern as the other endpoints)
  const origin = req.headers.origin as string | undefined;
  const allowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
    : '*';
  const corsOrigin =
    allowed === '*' ? '*' : origin && allowed.includes(origin) ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .json({ error: 'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not configured' });
  }

  const userId = String(req.query.id || '').trim();
  if (!userId) {
    return res.status(400).json({ error: 'A Spotify user `id` is required' });
  }

  // Cached?
  const cached = nameCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return res.status(200).json({ displayName: cached.name });
  }

  if (typeof fetch !== 'function') {
    return res
      .status(500)
      .json({ error: 'Server runtime too old (needs Node 18+ for fetch)' });
  }

  try {
    const token = await getAccessToken(clientId, clientSecret);
    if (!token) {
      return res.status(502).json({ error: 'Failed to authenticate with Spotify' });
    }

    const profileRes = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profileRes.status === 404) {
      nameCache.set(userId, { name: null, expires: Date.now() + NAME_TTL_MS });
      return res.status(200).json({ displayName: null });
    }
    if (!profileRes.ok) {
      return res
        .status(profileRes.status)
        .json({ error: `Spotify profile fetch failed (HTTP ${profileRes.status})` });
    }

    const profile = (await profileRes.json()) as { display_name?: string | null };
    const displayName = profile.display_name || null;
    nameCache.set(userId, { name: displayName, expires: Date.now() + NAME_TTL_MS });
    return res.status(200).json({ displayName });
  } catch (err) {
    console.error('spotify-user error:', err);
    return res.status(502).json({ error: 'Spotify API is unavailable' });
  }
}
