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
const BG = '#060609';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#e7e7ec';
const MUTED = '#6b7280';
const W = 495, H = 195;

function cardSvg(username: string, stats: { stars: number; forks: number; issues: number; contributions: number }) {
  const handle = `@${username}`;
  const badge = 'Stats';
  const CHA = 7.2;
  const pw = Math.round(20 + handle.length * CHA + 10 + badge.length * CHA + 20);
  const dotX = Math.round(20 + handle.length * CHA + 5);
  const badgeX = Math.round(20 + handle.length * CHA + 15);

  const pad = 16;
  const gapX = 11;
  const gapY = 8;
  const cardW = Math.floor((W - pad * 2 - gapX) / 2);
  const cardH = 48;
  const topY = 64;

  const items: Array<{ label: string; value: string }> = [
    { label: 'Stars', value: num(stats.stars) },
    { label: 'Forks', value: num(stats.forks) },
    { label: 'Issues', value: num(stats.issues) },
    { label: 'Contributions', value: num(stats.contributions) },
  ];

  const positions = [
    { x: pad, y: topY },
    { x: pad + cardW + gapX, y: topY },
    { x: pad, y: topY + cardH + gapY },
    { x: pad + cardW + gapX, y: topY + cardH + gapY },
  ];

  const cards = items.map((it, i) => {
    const p = positions[i];
    return `<g transform="translate(${p.x}, ${p.y})">
      <rect width="${cardW}" height="${cardH}" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="${cardW / 2}" y="26" text-anchor="middle" font-family="${FF}" font-size="20" font-weight="700" fill="${TEXT}">${esc(it.value)}</text>
      <text x="${cardW / 2}" y="40" text-anchor="middle" font-family="${FF}" font-size="11" fill="${MUTED}">${esc(it.label.toUpperCase())}</text>
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowA)"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${TEXT}">${esc(trunc(username))}</text>
  <g transform="translate(${W - pw - 16}, 18)"><rect width="${pw}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(handle)}</text><text x="${dotX - 8}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">·</text><text x="${badgeX - 8}" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(badge)}</text></g>
  <line x1="16" y1="52" x2="${W - 16}" y2="52" stroke="${BORDER}" stroke-width="1"/>
  ${cards}
  <text x="${W - 16}" y="${H - 10}" font-family="${FF}" font-size="9" fill="${MUTED}" text-anchor="end">Self-hosted · sorenthedev.indevs.in/api/cards/stats</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/><text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle" font-family="${FF}" font-size="13" fill="${MUTED}">${esc(msg)}</text></svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
