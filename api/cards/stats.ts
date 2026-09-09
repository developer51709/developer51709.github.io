import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Self-hosted GitHub Stats SVG Card
// ---------------------------------------------------------------------------

const GITHUB_API = 'https://api.github';

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1800_000; // 30 min

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

const THEME = {
  bg: '#0a0a0e',
  card: '#101014',
  border: '#1e1e26',
  text: '#e7e7ec',
  muted: '#888899',
  primary: '#4f7cff',
  accent: '#a78bfa',
  green: '#22c55e',
};

const ICON = {
  star: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" fill="${THEME.accent}"/>`,
  fork: `<path d="M12 2a3 3 0 0 0-3 3c0 1.1.6 2.1 1.5 2.6v.4L7.1 10.3a3 3 0 0 0 0 5.4l3.4 2.3v.4A3 3 0 1 0 12 20" fill="none" stroke="${THEME.primary}" stroke-width="1.8" stroke-linecap="round"/>`,
  issue: `<circle cx="12" cy="12" r="10" fill="none" stroke="${THEME.green}" stroke-width="1.8"/><line x1="12" y1="8" x2="12" y2="13" stroke="${THEME.green}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="${THEME.green}"/>`,
  commit: `<circle cx="12" cy="12" r="3.5" fill="${THEME.primary}"/><line x1="12" y1="3" x2="12" y2="8.5" stroke="${THEME.primary}" stroke-width="1.8"/><line x1="12" y1="15.5" x2="12" y2="21" stroke="${THEME.primary}" stroke-width="1.8"/>`,
};

function cardSvg(
  username: string,
  stats: { stars: number; forks: number; issues: number; contributions: number },
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <style>
    text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif}
  </style>

  <rect width="495" height="195" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>

  <!-- accent bar -->
  <rect width="495" height="4" rx="2" fill="${THEME.primary}"/>

  <!-- header -->
  <text x="20" y="44" font-size="14" font-weight="700" fill="${THEME.text}">${esc(trunc(username))}</text>
  <text x="475" y="44" font-size="11" fill="${THEME.muted}" text-anchor="end">Stats</text>

  <!-- row 1 -->
  <g transform="translate(70,78)">
    <g transform="translate(-36,-14) scale(1.17)">${ICON.star}</g>
    <text x="0" y="0" font-size="22" font-weight="700" fill="${THEME.text}">${num(stats.stars)}</text>
    <text x="0" y="16" font-size="11" fill="${THEME.muted}">Total Stars</text>
  </g>
  <g transform="translate(315,78)">
    <g transform="translate(-36,-14) scale(1.17)">${ICON.fork}</g>
    <text x="0" y="0" font-size="22" font-weight="700" fill="${THEME.text}">${num(stats.forks)}</text>
    <text x="0" y="16" font-size="11" fill="${THEME.muted}">Total Forks</text>
  </g>

  <!-- row 2 -->
  <g transform="translate(70,140)">
    <g transform="translate(-36,-14) scale(1.17)">${ICON.issue}</g>
    <text x="0" y="0" font-size="22" font-weight="700" fill="${THEME.text}">${num(stats.issues)}</text>
    <text x="0" y="16" font-size="11" fill="${THEME.muted}">Total Issues</text>
  </g>
  <g transform="translate(315,140)">
    <g transform="translate(-36,-14) scale(1.17)">${ICON.commit}</g>
    <text x="0" y="0" font-size="22" font-weight="700" fill="${THEME.text}">${num(stats.contributions)}</text>
    <text x="0" y="16" font-size="11" fill="${THEME.muted}">Contributions</text>
  </g>

  <text x="475" y="187" font-size="9" fill="${THEME.muted}" text-anchor="end">Self-hosted · GitHub Stats</text>
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
    // Profile
    const pKey = `stats-profile:${username}`;
    let profile = cached<Record<string, unknown>>(pKey);
    if (!profile) {
      const r = await fetch(`${GITHUB_API}/users/${username}`, {
        headers: ghHeaders(token),
      });
      if (!r.ok)
        return res
          .status(502)
          .setHeader('Content-Type', 'image/svg+xml')
          .send(errorSvg(`GitHub ${r.status}`));
      profile = (await r.json()) as Record<string, unknown>;
      store(pKey, profile);
    }

    // Repos (owned, non-fork, up to 300)
    const rKey = `stats-repos:${username}`;
    let repos = cached<Array<Record<string, unknown>>>(rKey);
    if (!repos) {
      const all: Array<Record<string, unknown>> = [];
      for (let pg = 1; pg <= 3; pg++) {
        const r = await fetch(
          `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&page=${pg}`,
          { headers: ghHeaders(token) },
        );
        if (!r.ok) break;
        const batch = (await r.json()) as Array<Record<string, unknown>>;
        all.push(...batch);
        if (batch.length < 100) break;
      }
      repos = all.filter(
        (r) =>
          !r.fork &&
          (r.owner as Record<string, unknown>)?.login === username,
      );
      store(rKey, repos);
    }

    // Contributions page (scrape the green square count)
    const cKey = `stats-contrib:${username}`;
    let contributions = cached<number>(cKey);
    if (contributions === null || contributions === undefined) {
      contributions = 0;
      try {
        const r = await fetch(
          `https://github.com/users/${username}`,
          { headers: { 'User-Agent': 'github-card/1.0' } },
        );
        if (r.ok) {
          const html = await r.text();
          // Match the contributions count from the profile header
          const m = html.match(
            /(\d[\d,]*)\s+contributions?\s+in\s+the\s+last\s+year/i,
          );
          if (m) contributions = parseInt(m[1].replace(/,/g, ''), 10);
        }
      } catch {
        // Fallback: sum starred count (not ideal but non-critical)
      }
      store(cKey, contributions);
    }

    const stats = {
      stars: repos!.reduce((s, r) => s + Number(r.stargazers_count || 0), 0),
      forks: repos!.reduce((s, r) => s + Number(r.forks_count || 0), 0),
      issues: repos!.reduce(
        (s, r) => s + Number(r.open_issues_count || 0),
        0,
      ),
      contributions,
    };

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(cardSvg(username, stats));
  } catch (err) {
    console.error('card/stats error:', err);
    return res
      .status(500)
      .setHeader('Content-Type', 'image/svg+xml')
      .send(errorSvg('Service error'));
  }
}

function errorSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <style>text{font-family:-apple-system,BlinkMacSystemFont,sans-serif}</style>
  <rect width="495" height="195" rx="14" fill="${THEME.bg}" stroke="${THEME.border}" stroke-width="1"/>
  <text x="247" y="101" text-anchor="middle" font-size="13" fill="${THEME.muted}">${esc(msg)}</text>
</svg>`;
}
