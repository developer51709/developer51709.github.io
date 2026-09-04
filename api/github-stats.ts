import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_API = 'https://api.github.com';

// Long-lived in-memory cache: GitHub data barely changes minute-to-minute and
// we want to stay far away from rate limits even on traffic spikes.
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data as T;
  cache.delete(key);
  return null;
}

function setCached(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

interface RepoLanguages {
  [language: string]: number;
}

export interface TechStackEntry {
  language: string;
  /** Total bytes of this language across all owned, non-forked repos. */
  bytes: number;
  /** Percentage of the total language bytes. */
  percent: number;
  /** Number of repos the language appears in. */
  repoCount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin as string | undefined;
  const allowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : '*';
  res.setHeader(
    'Access-Control-Allow-Origin',
    allowed === '*' ? '*' : (origin as string),
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = String(req.query.username || '').trim();
  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({ error: 'A valid `username` is required' });
  }

  const token = process.env.GITHUB_TOKEN;

  try {
    const headers = token ? authHeaders(token) : { Accept: 'application/vnd.github+json' };

    // --- Profile ---
    const profileKey = `profile:${username}`;
    let profile = getCached<Record<string, unknown>>(profileKey);
    if (!profile) {
      const r = await fetch(`${GITHUB_API}/users/${username}`, { headers });
      if (!r.ok) {
        return res
          .status(r.status)
          .json({ error: `GitHub profile fetch failed (HTTP ${r.status})` });
      }
      profile = await r.json();
      setCached(profileKey, profile);
    }

    // --- Repos (owned, non-forked) ---
    const reposKey = `repos:${username}`;
    let repos = getCached<Array<Record<string, unknown>>>(reposKey);
    if (!repos) {
      repos = [];
      let page = 1;
      // Up to 3 pages of 100 — plenty for a personal portfolio.
      for (; page <= 3; page++) {
        const r = await fetch(
          `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&page=${page}`,
          { headers },
        );
        if (!r.ok) break;
        const batch = (await r.json()) as Array<Record<string, unknown>>;
        repos.push(...batch);
        if (batch.length < 100) break;
      }
      repos = repos.filter(
        (r) => !r.fork && r.owner && (r.owner as Record<string, unknown>).login === username,
      );
      setCached(reposKey, repos);
    }

    // --- Languages per repo (parallel, capped) ---
    const langKey = `langs:${username}`;
    let languageMap = getCached<Map<string, { bytes: number; repos: Set<string> }>>(
      langKey,
    );
    if (!languageMap) {
      languageMap = new Map();
      const totalBytesByLang: Record<string, number> = {};
      const reposByLang: Record<string, number> = {};

      // Fetch languages for up to 30 most recently updated repos in parallel batches.
      const targets = repos.slice(0, 30);
      const batchSize = 8;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (repo) => {
            try {
              const r = await fetch(
                `${GITHUB_API}/repos/${username}/${repo.name}/languages`,
                { headers },
              );
              if (!r.ok) return null;
              return (await r.json()) as RepoLanguages;
            } catch {
              return null;
            }
          }),
        );
        results.forEach((langs, idx) => {
          if (!langs) return;
          const repoName = String(targets[i + idx].name);
          for (const [lang, bytes] of Object.entries(langs)) {
            totalBytesByLang[lang] = (totalBytesByLang[lang] || 0) + bytes;
            if (!(lang in reposByLang)) reposByLang[lang] = 0;
            if (!languageMap!.has(`${lang}:${repoName}`)) {
              reposByLang[lang] += 1;
              languageMap!.set(`${lang}:${repoName}`, { bytes, repos: new Set([repoName]) });
            }
          }
        });
      }

      const total = Object.values(totalBytesByLang).reduce((a, b) => a + b, 0);
      const techStack: TechStackEntry[] = Object.entries(totalBytesByLang)
        .map(([language, bytes]) => ({
          language,
          bytes,
          percent: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0,
          repoCount: reposByLang[language] || 0,
        }))
        .sort((a, b) => b.bytes - a.bytes);

      setCached(langKey, techStack);

      // --- Response payload ---
      const stats = {
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        totalStars: repos.reduce((s, r) => s + Number(r.stargazers_count || 0), 0),
        totalForks: repos.reduce((s, r) => s + Number(r.forks_count || 0), 0),
      };

      return res.status(200).json({ techStack, stats });
    }

    // Cached language map path — still need stats
    const stats = {
      publicRepos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      totalStars: repos.reduce((s, r) => s + Number(r.stargazers_count || 0), 0),
      totalForks: repos.reduce((s, r) => s + Number(r.forks_count || 0), 0),
    };
    return res.status(200).json({ techStack: languageMap, stats });
  } catch (err) {
    console.error('github-stats error:', err);
    return res.status(502).json({ error: 'Failed to fetch GitHub data' });
  }
}
