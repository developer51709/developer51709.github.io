import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_API = 'https://api.github.com';
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1800_000;
function cached<T>(k: string): T | null { const e = cache.get(k); if (e && e.expires > Date.now()) return e.data as T; cache.delete(k); return null; }
function store(k: string, v: unknown) { cache.set(k, { data: v, expires: Date.now() + CACHE_TTL }); }
function ghHeaders(t?: string) { return { Accept: 'application/vnd.github+json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }; }
function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function trunc(s: string, max = 14) { return s.length > max ? s.slice(0, max - 1) + '…' : s; }

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
const T = { bg: '#060609', border: 'rgba(255,255,255,0.08)', text: '#e7e7ec', muted: '#6b7280', primary: '#4f7cff', accent: '#a78bfa' };
const pillW = (handle: string, badge: string) => Math.round(20 + handle.length * 7.2 + 10 + badge.length * 7.2 + 20);

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5', Java: '#b07219', 'C++': '#f34b7d', C: '#555555',
  Go: '#00add8', Rust: '#dea584', Ruby: '#701516', PHP: '#4f5d95', Swift: '#f05138', Kotlin: '#a97bff',
  Dart: '#00b4ab', Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', Svelte: '#ff3e00',
  Lua: '#000080', Elixir: '#6e4a7e', Haskell: '#5e5086', Scala: '#c22d40', R: '#198ce7', MATLAB: '#e16737',
  'Jupyter Notebook': '#DA5B0B', Dockerfile: '#384d54', Makefile: '#427819', VimScript: '#199f4b', Nix: '#7e7eff',
};
const PALETTE = [T.primary, T.accent, '#22c55e', '#facc15', '#f87171', '#38bdf8', '#fb923c', '#c084fc', '#34d399', '#f472b6'];
function getLangColor(lang: string, idx: number) { return LANG_COLORS[lang] || PALETTE[idx % PALETTE.length]; }

function cardSvg(username: string, langs: { name: string; percent: number }[]) {
  const BAR_Y_START = 78, BAR_H = 20, BAR_GAP = 10;
  const MAX_BARS = Math.min(langs.length, 8);
  const totalH = 4 + 40 + MAX_BARS * (BAR_H + BAR_GAP) + 20;
  let bars = '';
  for (let i = 0; i < MAX_BARS; i++) {
    const lang = langs[i], y = BAR_Y_START + i * (BAR_H + BAR_GAP); const color = getLangColor(lang.name, i);
    const barW = Math.max(lang.percent * 3.5, 4);
    bars += `
    <text x="18" y="${y + 14}" font-family="${FF}" font-size="12" fill="${T.text}" font-weight="500">${esc(trunc(lang.name, 16))}</text>
    <rect x="160" y="${y + 2}" width="180" height="${BAR_H}" rx="6" fill="rgba(255,255,255,0.08)"/>
    <rect x="160" y="${y + 2}" width="${barW}" height="${BAR_H}" rx="6" fill="${color}"/>
    <text x="${String(355)}" y="${y + 14}" font-family="${FF}" font-size="11" fill="${T.muted}" text-anchor="end">${lang.percent.toFixed(1)}%</text>`;
  }
  const pill = `@${username}`;
  const pw = pillW(pill, 'Languages');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="${totalH}" viewBox="0 0 495 ${totalH}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="495" height="${totalH}" rx="18" fill="${T.bg}"/><rect width="495" height="${totalH}" rx="18" fill="url(#glowA)"/><rect width="495" height="${totalH}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="494" height="${String(totalH - 1)}" rx="18" fill="none" stroke="${T.border}" stroke-width="1"/>
  <rect width="495" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="495" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${T.text}">${esc(trunc(username))}</text>
  <g transform="translate(${String(495 - pw - 16)},20)"><rect width="${String(pw)}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(pill)}</text><text x="${String(12 + pill.length * 6.2 + 4)}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">· Languages</text></g>
  <line x1="16" y1="52" x2="479" y2="52" stroke="${T.border}" stroke-width="1"/>
  ${bars}
  <text x="479" y="${totalH - 8}" font-family="${FF}" font-size="9" fill="${T.muted}" text-anchor="end">Self-hosted</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195"><rect width="495" height="195" rx="18" fill="${T.bg}"/><text x="247" y="101" text-anchor="middle" font-family="${FF}" font-size="13" fill="${T.muted}">${esc(msg)}</text></svg>`;
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
    const cacheKey = `top-langs:${username}`;
    let langs = cached<{ name: string; percent: number }[]>(cacheKey);
    if (!langs) {
      const headers = ghHeaders(token);
      const allRepos: Array<{ name: string }> = [];
      for (let pg = 1; pg <= 3; pg++) {
        const r = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&page=${pg}`, { headers });
        if (!r.ok) break;
        const batch = (await r.json()) as Array<Record<string, unknown>>;
        for (const repo of batch) if (!repo.fork && (repo.owner as Record<string, unknown>)?.login === username) allRepos.push({ name: String(repo.name) });
        if (batch.length < 100) break;
      }
      const bytesByLang: Record<string, number> = {};
      const targets = allRepos.slice(0, 30); const batchSize = 8;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (repo) => {
          try { const r = await fetch(`${GITHUB_API}/repos/${username}/${repo.name}/languages`, { headers }); if (!r.ok) return null; return (await r.json()) as Record<string, number>; }
          catch { return null; }
        }));
        results.forEach((ls) => { if (!ls) return; for (const [lang, bytes] of Object.entries(ls)) bytesByLang[lang] = (bytesByLang[lang] || 0) + bytes; });
      }
      const total = Object.values(bytesByLang).reduce((a, b) => a + b, 0);
      langs = Object.entries(bytesByLang).map(([name, bytes]) => ({ name, percent: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0 })).sort((a, b) => b.percent - a.percent).slice(0, 8);
      store(cacheKey, langs);
    }
    res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, langs));
  } catch (err) { console.error('card/top-langs error:', err); return res.status(500).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Service error')); }
}
