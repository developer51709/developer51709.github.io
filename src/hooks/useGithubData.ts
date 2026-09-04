import { useCallback, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { formatDistance } from 'date-fns';
import {
  CustomError,
  GENERIC_ERROR,
  INVALID_CONFIG_ERROR,
  INVALID_GITHUB_USERNAME_ERROR,
  setTooManyRequestError,
} from '../constants/errors';
import { Profile } from '../interfaces/profile';
import { GithubProject } from '../interfaces/github-project';
import { SanitizedConfig } from '../interfaces/sanitized-config';

/**
 * Fetches the GitHub profile and projects for the configured username,
 * exposing loading/error state plus a manual retry. Extracted from the old
 * single-page GitProfile component so any page can consume it.
 */
export function useGithubData(
  config: SanitizedConfig,
): {
  profile: Profile | null;
  githubProjects: GithubProject[];
  loading: boolean;
  error: CustomError | null;
  retry: () => void;
} {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [githubProjects, setGithubProjects] = useState<GithubProject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<CustomError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getGithubProjects = useCallback(
    async (publicRepoCount: number): Promise<GithubProject[]> => {
      if (config.projects.github.mode === 'automatic') {
        if (publicRepoCount === 0) {
          return [];
        }

        const excludeRepo = config.projects.github.automatic.exclude.projects
          .map((project) => `+-repo:${project}`)
          .join('');

        const query = `user:${config.github.username}+fork:${!config.projects.github.automatic.exclude.forks}${excludeRepo}`;
        const url = `https://api.github.com/search/repositories?q=${query}&sort=${config.projects.github.automatic.sortBy}&per_page=${config.projects.github.automatic.limit}&type=Repositories`;

        const repoResponse = await axios.get(url, {
          headers: { 'Content-Type': 'application/vnd.github.v3+json' },
        });
        const repoData = repoResponse.data;

        return repoData.items;
      } else {
        if (config.projects.github.manual.projects.length === 0) {
          return [];
        }
        const repos = config.projects.github.manual.projects
          .map((project) => `+repo:${project}`)
          .join('');

        const url = `https://api.github.com/search/repositories?q=${repos}+fork:true&type=Repositories`;

        const repoResponse = await axios.get(url, {
          headers: { 'Content-Type': 'application/vnd.github.v3+json' },
        });
        const repoData = repoResponse.data;

        return repoData.items;
      }
    },
    [
      config.github.username,
      config.projects.github.mode,
      config.projects.github.manual.projects,
      config.projects.github.automatic.sortBy,
      config.projects.github.automatic.limit,
      config.projects.github.automatic.exclude.forks,
      config.projects.github.automatic.exclude.projects,
    ],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `https://api.github.com/users/${config.github.username}`,
      );
      const data = response.data;

      setProfile({
        avatar: data.avatar_url,
        name: data.name || ' ',
        bio: data.bio || '',
        location: data.location || '',
        company: data.company || '',
      });

      if (!config.projects.github.display) {
        return;
      }

      setGithubProjects(await getGithubProjects(data.public_repos));
    } catch (err) {
      handleError(err as AxiosError | Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, getGithubProjects, retryCount]);

  const handleError = (error: AxiosError | Error): void => {
    console.error('Error:', error);

    if (error instanceof AxiosError) {
      try {
        const reset = formatDistance(
          new Date(error.response?.headers?.['x-ratelimit-reset'] * 1000),
          new Date(),
          { addSuffix: true },
        );

        if (typeof error.response?.status === 'number') {
          switch (error.response.status) {
            case 403:
              setError(setTooManyRequestError(reset));
              break;
            case 404:
              setError(INVALID_GITHUB_USERNAME_ERROR);
              break;
            default:
              setError(GENERIC_ERROR);
              break;
          }
        } else {
          setError(GENERIC_ERROR);
        }
      } catch (innerError) {
        setError(GENERIC_ERROR);
      }
    } else {
      setError(GENERIC_ERROR);
    }
  };

  useEffect(() => {
    if (Object.keys(config).length === 0) {
      setError(INVALID_CONFIG_ERROR);
    } else {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  return { profile, githubProjects, loading, error, retry };
}
