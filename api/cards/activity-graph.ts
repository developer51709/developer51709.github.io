import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Self-hosted GitHub Contribution Activity Graph SVG Card
// ---------------------------------------------------------------------------

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

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trunc(s: string, max = 14) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

const THEME = {
  bg: '#0a0a0e',
  border: '#1e1e26',
  text: '#e7e7ec',
  muted: '#888899',
  primary: '#4f7cff',
  accent: '#a78bfa',
};

// Intensity → color (matching the website theme)
const LEVELS = [
  '#0e0e14', // 0 contributions
  '#1a2a4a', // low
  '#2a4a7a', // medium
  '#4f7cff', // high
  '#7da4ff', // very high (accent variant)
];

const CELL = 12;
const GAP = 3;
const ROWS = 7;
const LEFT_PAD = 32;
const TOP_PAD = 62;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cardSvg(
  username: string,
  contributions: { date: string; count: number }[],
  total: number,
) {
  // Build week-indexed grid (Sun=0 … Sat=6)
  const byDate = new Map(contributions.map((d) => [d.date, d.count]));

  // Find first Sunday on or before the first contribution date
  const sorted = contributions
    .filter((d) => d.count > 0)
    .map((d) => d.date)
    .sort();
  const firstDate = sorted.length > 0 ? sorted[0] : new Date().toISOString().slice(0, 10);
  const first = new Date(firstDate + 'T00:00:00Z');
  const dayOfWeek = first.getUTCDay();
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - dayOfWeek);

  // Generate all days from start to today
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  const allDays: { date: string; count: number; col: number; row: number }[] = [];
  const d = new Date(start);
  let col = 0;
  while (d <= today) {
    const dateStr = d.toISOString().slice(0, 10);
    allDays.push({
      date: dateStr,
      count: byDate.get(dateStr) || 0,
      col,
      row: d.getUTCDay(),
    });
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() === 0) col++;
  }

  // Month labels
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  for (const day of allDays) {
    const m = new Date(day.date + 'T00:00:00Z').getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        label: MONTHS[m],
        x: LEFT_PAD + day.col * (CELL + GAP),
      });
      lastMonth = m;
    }
  }

  const totalCols = col + 1;
  const W = LEFT_PAD + totalCols * (CELL + GAP) + 10;
  const H = TOP_PAD + ROWS * (CELL + GAP) + 30;

  // Cells
  let cells = '';
  for (const day of allDays) {
    const lvl =
      day.count === 0
        ? 0
        : day.count <= 2
          ? 1
          : day.count <= 5
            ? 2
            : day.count <= 10
              ? 3
              : 4;
    const x = LEFT_PAD + day.col * (CELL + GAP);
    const y = TOP_PAD + day.row * (CELL + GAP);
    cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[lvl]}"><title>${day.date}: ${day.count} contributions</title></rect>\n`;
  }

  // Month labels
  let monthSvg = '';
  for (const m of monthLabels) {
    monthSvg += `<text x="${m.x}" y="${TOP_PAD - 10}" font-size="9" fill="${THEME.muted}">${m.label}</text>\n`;
  }

  // Day-of-week labels
  const dayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];
  let daySvg = '';
  for (let i = 0; i < 7; i++) {
    if (dayLabels[i]) {
      daySvg += `<text x="0" y="${TOP_PAD + i * (CELL + GAP) + 10}" font-size="8" fill="${THEME.muted}">${dayLabels[i]}</text>\n`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif}
    title{font-size:12px}
  </style>

  <rect width="${W}" height="${H}" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>

  <!-- accent bar -->
  <rect width="${W}" height="4" rx="2" fill="${THEME.primary}"/>

  <!-- header -->
  <text x="14" y="36" font-size="14" font-weight="700" fill="${THEME.text}">${esc(trunc(username))}</text>
  <text x="${W - 14}" y="36" font-size="11" fill="${THEME.muted}" text-anchor="end">${total.toLocaleString()} contributions in the last year</text>

  ${monthSvg}
  ${daySvg}
  ${cells}

  <!-- legend -->
  <g transform="translate(${W - 130},${H - 18})">
    <text x="0" y="9" font-size="8" fill="${THEME.muted}">Less</text>
    ${LEVELS.map(
      (c, i) =>
        `<rect x="${26 + i * 14}" y="1" width="10" height="10" rx="2" fill="${c}"/>`,
    ).join('')}
    <text x="${26 + 5 * 14 + 2}" y="9" font-size="8" fill="${THEME.muted}">More</text>
  </g>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="722" height="160" viewBox="0 0 722 160">
  <style>text{font-family:-apple-system,BlinkMacSystemFont,sans-serif}</style>
  <rect width="722" height="160" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>
  <text x="361" y="84" text-anchor="middle" font-size="13" fill="${THEME.muted}">${esc(msg)}</text>
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
    return res
      .status(400)
      .setHeader('Content-Type', 'image/svg+xml')
      .send(errorSvg('Invalid username'));
  }

  const token = process.env.GITHUB_TOKEN;

  try {
    const cacheKey = `activity:${username}`;
    let result = cached<{
      contributions: { date: string; count: number }[];
      total: number;
    }>(cacheKey);

    if (!result) {
      let contributions: { date: string; count: number }[] = [];
      let total = 0;

      if (token) {
        const now = new Date();
        const to = now.toISOString().slice(0, 10);
        const from = new Date(now.getTime() - 365 * 86400_000)
          .toISOString()
          .slice(0, 10);

        const gql = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `query($u:String!,$f:String!,$t:String!){
              user(login:$u){
                contributionsCollection(from:$f,to:$t){
                  contributionCalendar{
                    totalContributions
                    weeks{
                      contributionDays{ date contributionCount }
                    }
                  }
                }
              }
            }`,
            variables: { u: username, f: from + 'T00:00:00Z', t: to + 'T23:59:59Z' },
          }),
        });

        if (gql.ok) {
          const body = await gql.json();
          const cal =
            body?.data?.user?.contributionsCollection?.contributionCalendar;
          if (cal) {
            total = cal.totalContributions;
            contributions = cal.weeks.flatMap(
              (w: { contributionDays: { date: string; contributionCount: number }[] }) =>
                w.contributionDays.map(
                  (d: { date: string; contributionCount: number }) => ({
                    date: d.date.slice(0, 10),
                    count: d.contributionCount,
                  }),
                ),
            );
          }
        }
      }

      if (contributions.length === 0) {
        // No token or fetch failed — show empty graph with a note
        contributions = [];
        total = 0;
      }

      result = { contributions, total };
      store(cacheKey, result);
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(
      cardSvg(username, result.contributions, result.total),
    );
  } catch (err) {
    console.error('card/activity-graph error:', err);
    return res
      .status(500)
      .setHeader('Content-Type', 'image/svg+xml')
      .send(errorSvg('Service error'));
  }
}
