import type { VercelRequest, VercelResponse } from '@vercel/node';

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

function num(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function trunc(s: string, max = 14) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ── Theme (matches abyssdark) ──────────────────────────────────────────────

const T = {
  bg: '#101014',
  border: 'rgba(231,231,236,0.08)',
  text: '#e7e7ec',
  muted: '#6b6b7b',
  primary: '#4f7cff',
  green: '#22c55e',
};

const W = 495;
const H = 195;

function cardSvg(
  username: string,
  data: {
    currentStreak: number;
    longestStreak: number;
    totalContributions: number;
    startDate: string;
    endDate: string;
  },
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif}</style>

  <rect width="${W}" height="${H}" rx="20" fill="${T.bg}" stroke="${T.border}" stroke-width="1"/>
  <rect width="${W}" height="3" rx="1.5" fill="${T.green}"/>

  <text x="20" y="38" font-size="14" font-weight="700" fill="${T.text}">${esc(trunc(username))}</text>
  <text x="${W - 20}" y="38" font-size="11" fill="${T.muted}" text-anchor="end">Streak</text>

  <line x1="20" y1="52" x2="${W - 20}" y2="52" stroke="${T.border}" stroke-width="1"/>

  <!-- current streak -->
  <g transform="translate(130,75)">
    <text x="0" y="0" font-size="42" font-weight="700" fill="${T.green}">${data.currentStreak}</text>
    <text x="0" y="22" font-size="12" font-weight="500" fill="${T.muted}">Current Streak</text>
    <text x="0" y="38" font-size="10" fill="${T.muted}">${data.startDate} → ${data.endDate}</text>
  </g>

  <!-- vertical divider -->
  <line x1="247" y1="58" x2="247" y2="132" stroke="${T.border}" stroke-width="1"/>

  <!-- longest streak -->
  <g transform="translate(365,75)">
    <text x="0" y="0" font-size="42" font-weight="700" fill="${T.primary}" text-anchor="middle">${data.longestStreak}</text>
    <text x="0" y="22" font-size="12" font-weight="500" fill="${T.muted}" text-anchor="middle">Longest Streak</text>
  </g>

  <!-- total -->
  <line x1="20" y1="132" x2="${W - 20}" y2="132" stroke="${T.border}" stroke-width="1"/>
  <text x="20" y="155" font-size="11" fill="${T.muted}">Total: <tspan font-weight="600" fill="${T.text}">${num(data.totalContributions)}</tspan> contributions</text>

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

// ── Calculate streaks ──────────────────────────────────────────────────────

function calcStreaks(days: { date: string; count: number }[]) {
  const total = days.reduce((s, d) => s + d.count, 0);

  let current = 0;
  let streakStart = '';
  let streakEnd = '';
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = today;

  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date <= checkDate && days[i].count > 0) {
      current++;
      streakEnd = days[i].date;
      streakStart = days[i].date;
      const d = new Date(days[i].date + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    } else if (days[i].date === checkDate && days[i].count === 0) {
      break;
    } else {
      break;
    }
  }

  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) { run++; if (run > longest) longest = run; }
    else { run = 0; }
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    total,
    startDate: streakStart || '—',
    endDate: streakEnd || '—',
  };
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
    const cacheKey = `streak:${username}`;
    let result = cached<{
      currentStreak: number; longestStreak: number; totalContributions: number;
      startDate: string; endDate: string;
    }>(cacheKey);

    if (!result) {
      if (token) {
        const now = new Date();
        const to = now.toISOString().slice(0, 10);
        const from = new Date(now.getTime() - 365 * 86400_000).toISOString().slice(0, 10);

        const gql = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query($u:String!,$f:String!,$t:String!){user(login:$u){contributionsCollection(from:$f,to:$t){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`,
            variables: { u: username, f: from + 'T00:00:00Z', t: to + 'T23:59:59Z' },
          }),
        });

        if (gql.ok) {
          const body = await gql.json();
          const cal = body?.data?.user?.contributionsCollection?.contributionCalendar;
          if (cal) {
            const days = cal.weeks.flatMap(
              (w: { contributionDays: { date: string; contributionCount: number }[] }) =>
                w.contributionDays.map((d: { date: string; contributionCount: number }) => ({
                  date: d.date.slice(0, 10), count: d.contributionCount,
                })),
            );
            result = { ...calcStreaks(days), totalContributions: cal.totalContributions };
          }
        }
      }

      if (!result) {
        try {
          const r = await fetch(`https://github.com/${username}`, { headers: { 'User-Agent': 'github-card/1.0' } });
          if (r.ok) {
            const html = await r.text();
            const m = html.match(/(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i);
            const total = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
            result = { currentStreak: 0, longestStreak: 0, totalContributions: total, startDate: '—', endDate: '—' };
          }
        } catch { /* */ }
      }

      if (!result) {
        result = { currentStreak: 0, longestStreak: 0, totalContributions: 0, startDate: '—', endDate: '—' };
      }
      store(cacheKey, result);
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, result));
  } catch (err) {
    console.error('card/streak error:', err);
    return res.status(500).setHeader('Content-Type', 'image/svg+xml').send(errorSvg('Service error'));
  }
}
