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

function cardSvg(username: string, data: { currentStreak: number; longestStreak: number; totalContributions: number; startDate: string; endDate: string }) {
  const handle = `@${username}`;
  const badge = 'Streak';
  const CHA = 7.2;
  const pw = Math.round(20 + handle.length * CHA + 10 + badge.length * CHA + 20);
  const dotX = Math.round(20 + handle.length * 6.2 + 4);
  const badgeX = Math.round(20 + handle.length * 6.2 + 14);

  const pad = 16;
  const gapX = 11;
  const cardW = Math.floor((W - pad * 2 - gapX) / 2);
  const cardH = 66;
  const topY = 64;

  const cards = [
    { value: String(data.currentStreak), label: 'Current Streak', sub: data.startDate !== '—' ? `${data.startDate} → ${data.endDate}` : 'No active streak' },
    { value: String(data.longestStreak), label: 'Longest Streak', sub: `${num(data.totalContributions)} total` },
  ].map((c, i) => {
    const x = pad + i * (cardW + gapX);
    return `<g transform="translate(${x}, ${topY})">
      <rect width="${cardW}" height="${cardH}" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="${cardW / 2}" y="28" text-anchor="middle" font-family="${FF}" font-size="24" font-weight="700" fill="${TEXT}">${esc(c.value)}</text>
      <text x="${cardW / 2}" y="44" text-anchor="middle" font-family="${FF}" font-size="11" fill="${MUTED}">${esc(c.label.toUpperCase())}</text>
      <text x="${cardW / 2}" y="58" text-anchor="middle" font-family="${FF}" font-size="9" fill="${MUTED}">${esc(c.sub)}</text>
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowA)"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/>
  <rect width="${W}" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="${W}" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${TEXT}">${esc(trunc(username))}</text>
  <g transform="translate(${W - pw - 16}, 18)"><rect width="${pw}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(handle)}</text><text x="${dotX}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">·</text><text x="${badgeX}" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(badge)}</text></g>
  <line x1="16" y1="52" x2="${W - 16}" y2="52" stroke="${BORDER}" stroke-width="1"/>
  ${cards}
  <text x="20" y="154" font-family="${FF}" font-size="11" fill="${MUTED}">Total: <tspan font-weight="600" fill="${TEXT}">${esc(num(data.totalContributions))}</tspan> contributions in the last year</text>
  <text x="${W - 16}" y="${H - 10}" font-family="${FF}" font-size="9" fill="${MUTED}" text-anchor="end">Self-hosted · sorenthedev.indevs.in/api/cards/streak</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/><text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle" font-family="${FF}" font-size="13" fill="${MUTED}">${esc(msg)}</text></svg>`;
}

function calcStreaks(days: { date: string; count: number }[]) {
  const total = days.reduce((s, d) => s + d.count, 0);
  let current = 0, streakStart = '', streakEnd = '';
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = today;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date <= checkDate && days[i].count > 0) { current++; streakEnd = days[i].date; streakStart = days[i].date; const d = new Date(days[i].date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); checkDate = d.toISOString().slice(0, 10); }
    else if (days[i].date === checkDate && days[i].count === 0) break; else break;
  }
  let longest = 0, run = 0;
  for (const d of days) { if (d.count > 0) { run++; if (run > longest) longest = run; } else run = 0; }
  return { currentStreak: current, longestStreak: longest, total, startDate: streakStart || '—', endDate: streakEnd || '—' };
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
