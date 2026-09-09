import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Self-hosted GitHub Streak Stats SVG Card
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

function num(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
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
  green: '#22c55e',
};

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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <style>
    text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif}
  </style>

  <rect width="495" height="195" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>

  <!-- accent bar -->
  <rect width="495" height="4" rx="2" fill="${THEME.accent}"/>

  <!-- header -->
  <text x="20" y="44" font-size="14" font-weight="700" fill="${THEME.text}">${esc(trunc(username))}</text>
  <text x="475" y="44" font-size="11" fill="${THEME.muted}" text-anchor="end">Streak</text>

  <!-- current streak (left) -->
  <g transform="translate(135,82)">
    <text x="0" y="0" font-size="40" font-weight="700" fill="${THEME.green}">${data.currentStreak}</text>
    <text x="0" y="20" font-size="11" fill="${THEME.muted}">Current Streak</text>
    <text x="0" y="34" font-size="9" fill="${THEME.muted}">${data.startDate} → ${data.endDate}</text>
  </g>

  <!-- divider -->
  <line x1="247" y1="60" x2="247" y2="170" stroke="${THEME.border}" stroke-width="1"/>

  <!-- longest streak (right) -->
  <g transform="translate(360,82)">
    <text x="0" y="0" font-size="40" font-weight="700" fill="${THEME.primary}">${data.longestStreak}</text>
    <text x="0" y="20" font-size="11" fill="${THEME.muted}">Longest Streak</text>
  </g>

  <!-- total row -->
  <line x1="20" y1="130" x2="475" y2="130" stroke="${THEME.border}" stroke-width="1"/>
  <g transform="translate(247,152)">
    <text x="0" y="0" font-size="12" fill="${THEME.muted}" text-anchor="middle">
      Total Contributions: <tspan font-weight="700" fill="${THEME.text}">${num(data.totalContributions)}</tspan>
    </text>
  </g>

  <text x="475" y="187" font-size="9" fill="${THEME.muted}" text-anchor="end">Self-hosted · Streak Stats</text>
</svg>`;
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <style>text{font-family:-apple-system,BlinkMacSystemFont,sans-serif}</style>
  <rect width="495" height="195" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>
  <text x="247" y="101" text-anchor="middle" font-size="13" fill="${THEME.muted}">${esc(msg)}</text>
</svg>`;
}

// ── Calculate streaks from contribution days ────────────────────────────────

function calcStreaks(
  days: { date: string; count: number }[],
): {
  currentStreak: number;
  longestStreak: number;
  total: number;
  startDate: string;
  endDate: string;
} {
  const total = days.reduce((s, d) => s + d.count, 0);

  // Work backwards from today to find current streak
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
      // Move check date back one day
      const d = new Date(days[i].date + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    } else if (days[i].date === checkDate && days[i].count === 0) {
      break; // today with 0 is ok (day isn't over)
    } else {
      break;
    }
  }

  // If today has 0 contributions, include it in the streak logic (the day isn't over)
  const todayData = days.find((d) => d.date === today);
  if (todayData && todayData.count === 0 && current > 0) {
    // Day isn't over yet — don't break the streak
  }

  // Longest streak
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
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
    return res
      .status(400)
      .setHeader('Content-Type', 'image/svg+xml')
      .send(errorSvg('Invalid username'));
  }

  const token = process.env.GITHUB_TOKEN;

  try {
    const cacheKey = `streak:${username}`;
    let result = cached<{
      currentStreak: number;
      longestStreak: number;
      totalContributions: number;
      startDate: string;
      endDate: string;
    }>(cacheKey);

    if (!result) {
      // Fetch contribution calendar via GraphQL (needs auth for reliable data)
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
            const days = cal.weeks.flatMap(
              (w: { contributionDays: { date: string; contributionCount: number }[] }) =>
                w.contributionDays.map(
                  (d: { date: string; contributionCount: number }) => ({
                    date: d.date.slice(0, 10),
                    count: d.contributionCount,
                  }),
                ),
            );
            result = { ...calcStreaks(days), totalContributions: cal.totalContributions };
          }
        }
      }

      // Fallback: scrape contributions count from profile page
      if (!result) {
        try {
          const r = await fetch(`https://github.com/${username}`, {
            headers: { 'User-Agent': 'github-card/1.0' },
          });
          if (r.ok) {
            const html = await r.text();
            const m = html.match(
              /(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i,
            );
            const total = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
            result = {
              currentStreak: 0,
              longestStreak: 0,
              totalContributions: total,
              startDate: '—',
              endDate: '—',
            };
          }
        } catch {
          // ignore
        }
      }

      if (!result) {
        result = {
          currentStreak: 0,
          longestStreak: 0,
          totalContributions: 0,
          startDate: '—',
          endDate: '—',
        };
      }
      store(cacheKey, result);
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, result));
  } catch (err) {
    console.error('card/streak error:', err);
    return res
      .status(500)
      .setHeader('Content-Type', 'image/svg+xml')
      .send(errorSvg('Service error'));
  }
}
