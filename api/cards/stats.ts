import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_API = 'https://api.github.com';
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1800_000;
function cached<T>(k: string): T | null { const e = cache.get(k); if (e && e.expires > Date.now()) return e.data as T; cache.delete(k); return null; }
function store(k: string, v: unknown) { cache.set(k, { data: v, expires: Date.now() + CACHE_TTL }); }
function ghHeaders(t?: string) { return { Accept: 'application/vnd.github+json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }; }
function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function trunc(s: string, max = 14) { return s.length > max ? s.slice(0, max - 1) + '…' : s; }
function num(n: number) { if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm'; if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'; return String(n); }

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

const T = {
  bg: '#060609', border: 'rgba(255,255,255,0.08)', text: '#e7e7ec', muted: '#6b7280',
  primary: '#4f7cff', accent: '#a78bfa', green: '#22c55e',
  iconBg: 'rgba(79,124,255,0.12)', iconBgAccent: 'rgba(167,139,250,0.12)', iconBgGreen: 'rgba(34,197,94,0.12)',
};
const W = 495, H = 195;
const pillW = (handle: string, badge: string) => Math.round(20 + handle.length * 7.2 + 10 + badge.length * 7.2 + 20);

function cardSvg(username: string, stats: { stars: number; forks: number; issues: number; contributions: number }) {
  const col1 = 130, col2 = 365, row1 = 92, row2 = 150;
  const blocks: Array<{ x: number; y: number; value: string; label: string; color: string; iconBg: string; icon: string }> = [
    { x: col1, y: row1, value: num(stats.stars), label: 'Stars', color: T.accent, iconBg: T.iconBgAccent, icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z' },
    { x: col2, y: row1, value: num(stats.forks), label: 'Forks', color: T.primary, iconBg: T.iconBg, icon: 'M12 2a3 3 0 0 0-3 3c0 1.1.6 2.1 1.5 2.6v.4L7.1 10.3a3 3 0 0 0 0 5.4l3.4 2.3v.4A3 3 0 1 0 12 20' },
    { x: col1, y: row2, value: num(stats.issues), label: 'Issues', color: T.green, iconBg: T.iconBgGreen, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1-4.5h-2V7h2v5z' },
    { x: col2, y: row2, value: num(stats.contributions), label: 'Contributions', color: T.primary, iconBg: T.iconBg, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  ];
  const items = blocks.map((s) => `
    <circle cx="${s.x - 52}" cy="${s.y - 4}" r="16" fill="${s.iconBg}"/>
    <g transform="translate(${s.x - 62}, ${s.y - 14}) scale(0.83)"><path d="${s.icon}" fill="${s.color}"/></g>
    <text x="${s.x}" y="${s.y}" font-size="24" font-weight="700" fill="${T.text}" text-anchor="middle">${s.value}</text>
    <text x="${s.x}" y="${s.y + 16}" font-size="11" fill="${T.muted}" text-anchor="middle">${s.label}</text>`).join('');

  const pill = `@${username}`;
  const pw = pillW(pill, 'Stats');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="${T.bg}"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowA)"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${String(W - 1)}" height="${String(H - 1)}" rx="18" fill="none" stroke="${T.border}" stroke-width="1"/>
  <rect width="${W}" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="${W}" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${T.text}">${esc(trunc(username))}</text>
  <g transform="translate(${String(W - pw - 16)},20)"><rect width="${String(pw)}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(pill)}</text><text x="${String(12 + pill.length * 6.2 + 4)}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">· Stats</text></g>
  <line x1="16" y1="52" x2="${String(W - 16)}" y2="52" stroke="${T.border}" stroke-width="1"/>
  ${items}
  <text x="${String(W - 16)}" y="${H - 10}" font-family="${FF}" font-size="9" fill="${T.muted}" text-anchor="end">Self-hosted</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="18" fill="${T.bg}"/><text x="${String(W / 2)}" y="${String(H / 2 + 6)}" text-anchor="middle" font-family="${FF}" font-size="13" fill="${T.muted}">${esc(msg)}</text></svg>`;
}

export default async function handler(req: import('@vercel/node').VercelRequest, res: import('@vercel/node').VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  res.setHeader('Access-Control-Allow-Origin', origin || '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();
  const username = String(req.query.username ?? '').trim();
  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) return res.status(400).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Invalid username'));
  const token = process.env.GITHUB_TOKEN;
  try {
    const pKey = `stats-p:${username}`;
    let profile = cached<Record<string, unknown>>(pKey);
    if (!profile) {
      const r = await fetch(`${GITHUB_API}/users/${username}`, { headers: ghHeaders(token) });
      if (!r.ok) return res.status(502).setHeader('Content-Type', 'image/svg+xml').send(errorSvg(`GitHub ${r.status}`));
      profile = (await r.json()) as Record<string, unknown>; store(pKey, profile);
    }
    const rKey = `stats-r:${username}`;
    let repos = cached<Array<Record<string, unknown>>>(rKey);
    if (!repos) {
      const all: Array<Record<string, unknown>> = [];
      for (let pg = 1; pg <= 3; pg++) {
        const r = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&page=${pg}`, { headers: ghHeaders(token) });
        if (!r.ok) break;
        const batch = (await r.json()) as Array<Record<string, unknown>>; all.push(...batch);
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
        if (r.ok) { const html = await r.text(); const m = html.match(/(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i); if (m) contributions = parseInt(m[1].replace(/,/g, ''), 10); }
      } catch { /* */ }
      store(cKey, contributions);
    }
    const stats = {
      stars: repos!.reduce((s, r) => s + Number(r.stargazers_count || 0), 0),
      forks: repos!.reduce((s, r) => s + Number(r.forks_count || 0), 0),
      issues: repos!.reduce((s, r) => s + Number(r.open_issues_count || 0), 0),
      contributions,
    };
    res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, stats));
  } catch (err) { console.error('card/stats error:', err); return res.status(500).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Service error')); }
}
