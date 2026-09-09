import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1800_000;
function cached<T>(k: string): T | null { const e = cache.get(k); if (e && e.expires > Date.now()) return e.data as T; cache.delete(k); return null; }
function store(k: string, v: unknown) { cache.set(k, { data: v, expires: Date.now() + CACHE_TTL }); }
function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function num(n: number) { if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm'; if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'; return String(n); }
function trunc(s: string, max = 14) { return s.length > max ? s.slice(0, max - 1) + '…' : s; }

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
const BG = '#060609';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#e7e7ec';
const MUTED = '#6b7280';
const W = 495, H = 195;
function pillW(handle: string, badge: string) { return Math.round(12 + handle.length * 6.2 + 10 + badge.length * 6.2 + 12); }

const HEADER_ICON = `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`;
// Lucide icons (lucide-static v0.532.0, MIT) — viewBox 0 0 24 24, stroke 2, round.
const ICONS = {
  // lucide/flame
  flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
  // lucide/trophy (5 paths)
  trophy: `<path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/>`,
} as const;

function cardSvg(username: string, data: { currentStreak: number; longestStreak: number; totalContributions: number; startDate: string; endDate: string }) {
  const handle = `@${username}`;
  const badge = 'Streak';
  const pw = pillW(handle, badge);

  const pad = 16;
  const gapX = 10;
  const cardW = Math.floor((W - pad * 2 - gapX) / 2);
  const cardH = 52;
  const topY = 64;

  const cards = [
    { value: String(data.currentStreak), label: 'Current Streak', accent: '#f97316', icon: ICONS.flame },
    { value: String(data.longestStreak), label: 'Longest Streak', accent: '#a78bfa', icon: ICONS.trophy },
  ].map((c, i) => {
    const x = pad + i * (cardW + gapX);
    return `<g transform="translate(${x}, ${topY})">
      <rect width="${cardW}" height="${cardH}" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <g transform="translate(14, 12)">
        <circle cx="14" cy="14" r="14" fill="${c.accent}1F"/>
        <svg x="6" y="6" width="16" height="16" viewBox="0 0 24 24" overflow="visible" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="${c.accent}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${c.icon}</g>
        </svg>
      </g>
      <text x="48" y="26" dominant-baseline="middle" font-family="${FF}" font-size="10" font-weight="600" letter-spacing="1.2" fill="${MUTED}">${esc(c.label.toUpperCase())}</text>
      <text x="48" y="44" font-family="${FF}" font-size="16" font-weight="700" fill="${TEXT}">${esc(c.value)}</text>
    </g>`;
  }).join('');

  // Second row: total line centered below the two cards
  const totalLine = `<text x="${W / 2}" y="138" text-anchor="middle" font-family="${FF}" font-size="11" fill="${MUTED}">Total: <tspan font-weight="600" fill="${TEXT}">${esc(num(data.totalContributions))}</tspan> contributions in the last year</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowA)"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/>
  <rect width="${W}" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="${W}" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <g transform="translate(16, 14)"><circle cx="14" cy="14" r="14" fill="#f973161F"/><svg x="6" y="6" width="16" height="16" viewBox="0 0 24 24" overflow="visible" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#f97316" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${HEADER_ICON}</g></svg></g>
  <text x="48" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${TEXT}">Streak</text>
  <g transform="translate(${W - pw - 16}, 18)"><rect width="${pw}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(handle)}</text><text x="${12 + handle.length * 6.2 + 4}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">·</text><text x="${12 + handle.length * 6.2 + 14}" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(badge)}</text></g>
  <line x1="16" y1="52" x2="${W - 16}" y2="52" stroke="${BORDER}" stroke-width="1"/>
  ${cards}
  ${totalLine}
  <text x="${W - 16}" y="${H - 10}" font-family="${FF}" font-size="9" fill="${MUTED}" text-anchor="end">Self-hosted · sorenthedev.indevs.in/api/cards/streak</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/><text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle" font-family="${FF}" font-size="13" fill="${MUTED}">${esc(msg)}</text></svg>`;
}

function calcStreaks(days: { date: string; count: number }[]) {
  let current = 0, streakStart = '', streakEnd = '';
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = today;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date <= checkDate && days[i].count > 0) { current++; streakEnd = days[i].date; streakStart = days[i].date; const d = new Date(days[i].date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); checkDate = d.toISOString().slice(0, 10); }
    else if (days[i].date === checkDate && days[i].count === 0) break; else break;
  }
  let longest = 0, run = 0;
  for (const d of days) { if (d.count > 0) { run++; if (run > longest) longest = run; } else run = 0; }
  return { currentStreak: current, longestStreak: longest, startDate: streakStart || '—', endDate: streakEnd || '—' };
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
    const cacheKey = `streak:${username}`;
    let result = cached<{ currentStreak: number; longestStreak: number; totalContributions: number; startDate: string; endDate: string }>(cacheKey);
    if (!result) {
      if (token) {
        const now = new Date(); const to = now.toISOString().slice(0, 10); const from = new Date(now.getTime() - 365 * 86400_000).toISOString().slice(0, 10);
        const gql = await fetch('https://api.github.com/graphql', {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `query($u:String!,$f:String!,$t:String!){user(login:$u){contributionsCollection(from:$f,to:$t){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`, variables: { u: username, f: from + 'T00:00:00Z', t: to + 'T23:59:59Z' } }),
        });
        if (gql.ok) {
          const body = await gql.json(); const cal = body?.data?.user?.contributionsCollection?.contributionCalendar;
          if (cal) {
            const days = cal.weeks.flatMap((w: { contributionDays: { date: string; contributionCount: number }[] }) => w.contributionDays.map((d: { date: string; contributionCount: number }) => ({ date: d.date.slice(0, 10), count: d.contributionCount })));
            result = { ...calcStreaks(days), totalContributions: cal.totalContributions };
          }
        }
      }
      if (!result) {
        try {
          const r = await fetch(`https://github.com/${username}`, { headers: { 'User-Agent': 'github-card/1.0' } });
          if (r.ok) { const html = await r.text(); const m = html.match(/(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i); const total = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0; result = { currentStreak: 0, longestStreak: 0, totalContributions: total, startDate: '—', endDate: '—' }; }
        } catch { /* */ }
      }
      if (!result) result = { currentStreak: 0, longestStreak: 0, totalContributions: 0, startDate: '—', endDate: '—' };
      store(cacheKey, result);
    }
    res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, result));
  } catch (err) { console.error('card/streak error:', err); return res.status(500).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Service error')); }
}
