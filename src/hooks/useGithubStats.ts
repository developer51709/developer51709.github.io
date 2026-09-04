import { useEffect, useState } from 'react';

export interface TechStackEntry {
  language: string;
  bytes: number;
  percent: number;
  repoCount: number;
}

export interface GithubStats {
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
}

interface GithubStatsResponse {
  techStack: TechStackEntry[];
  stats: GithubStats;
}

export function useGithubStats(username: string | undefined) {
  const [data, setData] = useState<GithubStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/github-stats?username=${encodeURIComponent(username)}`)
      .then(async (res) => {
        const raw = await res.text();
        try {
          return JSON.parse(raw) as GithubStatsResponse;
        } catch {
          throw new Error('Stats service is unavailable');
        }
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return { data, loading, error };
}
