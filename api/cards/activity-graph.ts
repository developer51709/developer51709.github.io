import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1800_000;
function cached<T>(k: string): T | null { const e = cache.get(k); if (e && e.expires > Date.now()) return e.data as T; cache.delete(k); return null; }
function store(k: string, v: unknown) { cache.set(k, { data: v, expires: Date.now() + CACHE_TTL }); }
function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function trunc(s: string, max = 14) { return s.length > max ? s.slice(0, max - 1) + '…' : s; }

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
const T = { bg: '#060609', border: 'rgba(255,255,255,0.08)', text: '#e7e7ec', muted: '#6b7280', primary: '#4f7cff', accent: '#a78bfa' };
const pillW = (handle: string, badge: string) => Math.round(20 + handle.length * 7.2 + 10 + badge.length * 7.2 + 20);

const LEVELS = ['#0e0e14', '#1a2a4a', '#2a4a7a', '#4f7cff', '#7da4ff'];
const CELL = 8, GAP = 1, LEFT_PAD = 27, TOP_PAD = 60, CARD_W = 495, CARD_H = 195;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cardSvg(username: string, contributions: { date: string; count: number }[], total: number) {
  const byDate = new Map(contributions.map((d) => [d.date, d.count]));
  const sorted = contributions.filter((d) => d.count > 0).map((d) => d.date).sort();
  const firstDate = sorted.length > 0 ? sorted[0] : new Date().toISOString().slice(0, 10);
  const first = new Date(firstDate + 'T00:00:00Z');
  const dayOfWeek = first.getUTCDay();
  const start = new Date(first); start.setUTCDate(start.getUTCDate() - dayOfWeek);

  const today = new Date(); today.setUTCHours(23, 59, 59, 999);
  const allDays: { date: string; count: number; col: number; row: number }[] = [];
  const d = new Date(start); let col = 0;
  while (d <= today) {
    const dateStr = d.toISOString().slice(0, 10);
    allDays.push({ date: dateStr, count: byDate.get(dateStr) || 0, col, row: d.getUTCDay() });
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() === 0) col++;
  }

  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  for (const day of allDays) {
    const m = new Date(day.date + 'T00:00:00Z').getUTCMonth();
    if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], x: LEFT_PAD + day.col * (CELL + GAP) }); lastMonth = m; }
  }

  let cells = '';
  for (const day of allDays) {
    const lvl = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 5 ? 2 : day.count <= 10 ? 3 : 4;
    const x = LEFT_PAD + day.col * (CELL + GAP);
    const y = TOP_PAD + day.row * (CELL + GAP);
    cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${LEVELS[lvl]}"><title>${day.date}: ${day.count} contributions</title></rect>\n`;
  }

  let monthSvg = '';
  for (const m of monthLabels) monthSvg += `<text x="${m.x}" y="${TOP_PAD - 8}" font-family="${FF}" font-size="8" fill="${T.muted}">${m.label}</text>\n`;

  const dayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];
  let daySvg = '';
  for (let i = 0; i < 7; i++) if (dayLabels[i]) daySvg += `<text x="0" y="${TOP_PAD + i * (CELL + GAP) + 7}" font-family="${FF}" font-size="7" fill="${T.muted}">${dayLabels[i]}</text>\n`;

  const pill = `@${username}`;
  const pw = pillW(pill, 'Activity');
  const countLabel = `${total.toLocaleString()} contributions`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" rx="18" fill="${T.bg}"/><rect width="${CARD_W}" height="${CARD_H}" rx="18" fill="url(#glowA)"/><rect width="${CARD_W}" height="${CARD_H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${String(CARD_W - 1)}" height="${String(CARD_H - 1)}" rx="18" fill="none" stroke="${T.border}" stroke-width="1"/>
  <rect width="${CARD_W}" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="${CARD_W}" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${T.text}">${esc(trunc(username))}</text>
  <g transform="translate(${String(CARD_W - pw - 16)},20)"><rect width="${String(pw)}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(pill)}</text><text x="${String(12 + pill.length * 6.2 + 4)}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">· ${esc(countLabel)}</text></g>
  <line x1="16" y1="52" x2="${String(CARD_W - 16)}" y2="52" stroke="${T.border}" stroke-width="1"/>
  ${monthSvg}
  ${daySvg}
  ${cells}
  <g transform="translate(${String(CARD_W - 110)},${CARD_H - 14})">
    <text x="0" y="8" font-family="${FF}" font-size="7" fill="${T.muted}">Less</text>
    ${LEVELS.map((c, i) => `<rect x="${22 + i * 12}" y="0" width="8" height="8" rx="2" fill="${c}"/>`).join('')}
    <text x="${String(22 + 5 * 12 + 2)}" y="8" font-family="${FF}" font-size="7" fill="${T.muted}">More</text>
  </g>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}"><rect width="${CARD_W}" height="${CARD_H}" rx="18" fill="${T.bg}"/><text x="${String(CARD_W / 2)}" y="${String(CARD_H / 2 + 6)}" text-anchor="middle" font-family="${FF}" font-size="13" fill="${T.muted}">${esc(msg)}</text></svg>`;
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
    const cacheKey = `activity:${username}`;
    let result = cached<{ contributions: { date: string; count: number }[]; total: number }>(cacheKey);
    if (!result) {
      let contributions: { date: string; count: number }[] = []; let total = 0;
      if (token) {
        const now = new Date(); const to = now.toISOString().slice(0, 10); const from = new Date(now.getTime() - 365 * 86400_000).toISOString().slice(0, 10);
        const gql = await fetch('https://api.github.com/graphql', {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `query($u:String!,$f:String!,$t:String!){user(login:$u){contributionsCollection(from:$f,to:$t){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`, variables: { u: username, f: from + 'T00:00:00Z', t: to + 'T23:59:59Z' } }),
        });
        if (gql.ok) {
          const body = await gql.json(); const cal = body?.data?.user?.contributionsCollection?.contributionCalendar;
          if (cal) {
            total = cal.totalContributions;
            contributions = cal.weeks.flatMap((w: { contributionDays: { date: string; contributionCount: number }[] }) => w.contributionDays.map((d: { date: string; contributionCount: number }) => ({ date: d.date.slice(0, 10), count: d.contributionCount })));
          }
        }
      }
      if (contributions.length === 0) { contributions = []; total = 0; }
      result = { contributions, total }; store(cacheKey, result);
    }
    res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, result.contributions, result.total));
  } catch (err) { console.error('card/activity-graph error:', err); return res.status(500).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Service error')); }
}
