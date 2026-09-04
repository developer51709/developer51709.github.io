import { AiOutlineStar, AiOutlineFork, AiOutlineGithub } from 'react-icons/ai';
import { GithubStats, TechStackEntry } from '../../hooks/useGithubStats';
import { skeleton } from '../../utils';

interface GithubStatsCardProps {
  stats: GithubStats | null;
  techStack: TechStackEntry[] | null;
  loading: boolean;
  username: string;
}

const StatTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}) => (
  <div className="card bg-base-100 shadow-md card-sm">
    <div className="card-body p-5 items-center text-center">
      <div className="text-primary">{icon}</div>
      <div className="text-2xl font-bold text-base-content">
        {value === null ? (
          <span className="loading loading-dots loading-sm" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      <div className="text-xs text-base-content/50">{label}</div>
    </div>
  </div>
);

const GithubStatsCard = ({
  stats,
  techStack,
  loading,
  username,
}: GithubStatsCardProps) => {
  const top = (techStack ?? []).slice(0, 8);
  const maxPercent = Math.max(1, ...top.map((t) => t.percent));

  return (
    <div className="card bg-base-200 shadow-xl border border-base-300">
      <div className="card-body p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <AiOutlineGithub className="text-2xl" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-base-content">
              GitHub Stats
            </h3>
            <div className="text-base-content/60 text-xs sm:text-sm mt-1">
              Live data from github.com/{username}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Repositories"
            value={stats ? stats.publicRepos : null}
            icon={<AiOutlineGithub className="w-6 h-6" />}
          />
          <StatTile
            label="Total Stars"
            value={stats ? stats.totalStars : null}
            icon={<AiOutlineStar className="w-6 h-6" />}
          />
          <StatTile
            label="Total Forks"
            value={stats ? stats.totalForks : null}
            icon={<AiOutlineFork className="w-6 h-6" />}
          />
          <StatTile
            label="Followers"
            value={stats ? stats.followers : null}
            icon={<AiOutlineGithub className="w-6 h-6" />}
          />
        </div>

        {/* Language distribution bar chart */}
        <div>
          <div className="text-sm font-semibold text-base-content/70 mb-3">
            Language distribution
          </div>
          {loading || !techStack ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  {skeleton({ widthCls: 'w-full', heightCls: 'h-5', shape: '' })}
                </div>
              ))}
            </div>
          ) : top.length === 0 ? (
            <div className="text-sm text-base-content/40">
              No language data yet.
            </div>
          ) : (
            <div className="space-y-3">
              {top.map((entry) => (
                <div key={entry.language} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-base-content/60 truncate">
                    {entry.language}
                  </span>
                  <progress
                    className="progress progress-primary flex-1"
                    value={entry.percent}
                    max={maxPercent}
                  />
                  <span className="w-12 text-xs text-base-content/50 text-right tabular-nums">
                    {entry.percent}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GithubStatsCard;
