import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_API = 'https://api.github.com';

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1800_000;

function cached<T>(key: string): T | null {
  const e = cache.get(key);
  if (e && e.expires > Date.now()) return e.data as T;
  cache.delete(key);
  return null;
}
function store(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

function ghHeaders(token?: string) {
  return {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trunc(s: string, max = 14) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function num(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

// ── Theme (matches abyssdark) ──────────────────────────────────────────────

const T = {
  bg: '#101014',
  border: 'rgba(231,231,236,0.08)',
  text: '#e7e7ec',
  muted: '#6b6b7b',
  primary: '#4f7cff',
  accent: '#a78bfa',
  green: '#22c55e',
  iconBg: 'rgba(79,124,255,0.12)',
  iconBgAccent: 'rgba(167,139,250,0.12)',
  iconBgGreen: 'rgba(34,197,94,0.12)',
};

const W = 495;
const H = 195;

// ── SVG ────────────────────────────────────────────────────────────────────

function cardSvg(
  username: string,
  stats: { stars: number; forks: number; issues: number; contributions: number },
) {
  // 2×2 grid of stat blocks. Each block: icon circle (24r) + value + label.
  // Column centers at x=130 and x=365, rows at y=92 and y=150.
  const col1 = 130;
  const col2 = 365;
  const row1 = 92;
  const row2 = 150;

  const statBlocks = [
    { x: col1, y: row1, value: num(stats.stars), label: 'Stars', color: T.accent, iconBg: T.iconBgAccent, icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z' },
    { x: col2, y: row1, value: num(stats.forks), label: 'Forks', color: T.primary, iconBg: T.iconBg, icon: 'M12 2a3 3 0 0 0-3 3c0 1.1.6 2.1 1.5 2.6v.4L7.1 10.3a3 3 0 0 0 0 5.4l3.4 2.3v.4A3 3 0 1 0 12 20' },
    { x: col1, y: row2, value: num(stats.issues), label: 'Issues', color: T.green, iconBg: T.iconBgGreen, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1-4.5h-2V7h2v5z' },
    { x: col2, y: row2, value: num(stats.contributions), label: 'Contributions', color: T.primary, iconBg: T.iconBg, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  ];

  const blocks = statBlocks
    .map(
      (s) => `
    <circle cx="${s.x - 52}" cy="${s.y - 4}" r="16" fill="${s.iconBg}"/>
    <g transform="translate(${s.x - 62}, ${s.y - 14}) scale(0.83)">
      <path d="${s.icon}" fill="${s.color}"/>
    </g>
    <text x="${s.x}" y="${s.y}" font-size="24" font-weight="700" fill="${T.text}" text-anchor="middle">${s.value}</text>
    <text x="${s.x}" y="${s.y + 16}" font-size="11" fill="${T.muted}" text-anchor="middle">${s.label}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif}</style>

  <rect width="${W}" height="${H}" rx="20" fill="${T.bg}" stroke="${T.border}" stroke-width="1"/>
  <rect width="${W}" height="3" rx="1.5" fill="${T.primary}"/>

  <text x="20" y="38" font-size="14" font-weight="700" fill="${T.text}">${esc(trunc(username))}</text>
  <text x="${W - 20}" y="38" font-size="11" fill="${T.muted}" text-anchor="end">GitHub Stats</text>

  <line x1="20" y1="52" x2="${W - 20}" y2="52" stroke="${T.border}" stroke-width="1"/>

  ${blocks}

  <text x="${W - 20}" y="${H - 10}" font-size="9" fill="${T.muted}" text-anchor="end">Self-hosted</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>text{font-family:-apple-system,BlinkMacSystemFont,sans-serif}</style>
  <rect width="${W}" height="${H}" rx="20" fill="${T.bg}" stroke="${T.border}" stroke-width="1"/>
  <text x="${W / 2}" y="${H / 2 + 5}" text-anchor="middle" font-size="13" fill="${T.muted}">${esc(msg)}</text>
</svg>`;
}

// ── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();

  const username = String(req.query.username ?? '').trim();
  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Invalid username'));
  }

  const token = process.env.GITHUB_TOKEN;

  try {
    const pKey = `stats-p:${username}`;
    let profile = cached<Record<string, unknown>>(pKey);
    if (!profile) {
      const r = await fetch(`${GITHUB_API}/users/${username}`, { headers: ghHeaders(token) });
      if (!r.ok) return res.status(502).setHeader('Content-Type', 'image/svg+xml').send(errorSvg(`GitHub ${r.status}`));
      profile = (await r.json()) as Record<string, unknown>;
      store(pKey, profile);
    }

    const rKey = `stats-r:${username}`;
    let repos = cached<Array<Record<string, unknown>>>(rKey);
    if (!repos) {
      const all: Array<Record<string, unknown>> = [];
      for (let pg = 1; pg <= 3; pg++) {
        const r = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&page=${pg}`, { headers: ghHeaders(token) });
        if (!r.ok) break;
        const batch = (await r.json()) as Array<Record<string, unknown>>;
        all.push(...batch);
        if (batch.length < 100) break;
      }
      repos = all.filter((r) => !r.fork && (r.owner as Record<string, unknown>)?.login === username);
      store(rKey, repos);
    }

    const cKey = `stats-c:${username}`;
    let contributions = cached<number>(cKey);
    if (contributions === null || contributions === undefined) {
      contributions = 0;
      try {
        const r = await fetch(`https://github.com/users/${username}`, { headers: { 'User-Agent': 'github-card/1.0' } });
        if (r.ok) {
          const html = await r.text();
          const m = html.match(/(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i);
          if (m) contributions = parseInt(m[1].replace(/,/g, ''), 10);
        }
      } catch { /* */ }
      store(cKey, contributions);
    }

    const stats = {
      stars: repos!.reduce((s, r) => s + Number(r.stargazers_count || 0), 0),
      forks: repos!.reduce((s, r) => s + Number(r.forks_count || 0), 0),
      issues: repos!.reduce((s, r) => s + Number(r.open_issues_count || 0), 0),
      contributions,
    };

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, stats));
  } catch (err) {
    console.error('card/stats error:', err);
    return res.status(500).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Service error'));
  }
}
