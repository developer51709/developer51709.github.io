import { useState } from 'react';
import { TechStackEntry } from '../../hooks/useGithubStats';
import { skeleton } from '../../utils';
import { MdInfo, MdOutlineExtension } from 'react-icons/md';

/**
 * Builds a skill-icons.dev SVG URL for a list of language/tech short codes.
 * See https://skillicons.dev for the full icon id list.
 */
export const skillIconUrl = (ids: string[], theme = 'dark'): string =>
  `https://skillicons.dev/icons?i=${ids.join(',')}&theme=${theme}`;

// GitHub language name -> skill-icons id. Only the ids that differ from a
// simple lowercase of the language name need to be listed here.
const ICON_ALIASES: Record<string, string> = {
  'C++': 'cpp',
  'C#': 'cs',
  'Objective-C': 'objc',
  'Visual Basic .NET': 'vb',
  Shell: 'bash',
  Dockerfile: 'docker',
  Vue: 'vue',
  'Emacs Lisp': 'lisp',
  'Protocol Buffer': 'protobuf',
  Jinja: 'jinja',
  ApacheConf: 'apache',
  'Vim Script': 'vim',
  PowerShell: 'powershell',
  Batchfile: 'bat',
  Kotlin: 'kotlin',
  Ruby: 'ruby',
  Rust: 'rust',
  Go: 'go',
  PHP: 'php',
  Python: 'python',
  Java: 'java',
  Swift: 'swift',
  Dart: 'dart',
  Scala: 'scala',
  Perl: 'perl',
  Haskell: 'haskell',
  Elixir: 'elixir',
  Lua: 'lua',
  Clojure: 'clojure',
  Groovy: 'groovy',
  'F#': 'fs',
};

const iconIdFor = (language: string): string =>
  ICON_ALIASES[language] ?? language.toLowerCase().replace(/[^a-z0-9+#]/g, '');

// Short, human explanations for what each language is used for. Languages not
// listed fall back to a generic description built from the name.
const LANGUAGE_DESCRIPTIONS: Record<string, string> = {
  JavaScript:
    'The core language of the web — used for interactive frontends, Node.js backends, Discord bots and build tooling.',
  TypeScript:
    'A strongly-typed superset of JavaScript that catches bugs at compile time. Used for larger apps, libraries and full-stack projects.',
  Python:
    'Versatile scripting language used for automation, data processing, API backends and quick prototypes.',
  PHP:
    'Server-side web language — powers Laravel apps, REST APIs and classic dynamic websites.',
  HTML:
    'Markup that structures every web page — templates, layouts and app shells.',
  CSS:
    'Styling language for the web — layouts, themes, animations and responsive design.',
  SCSS:
    'A CSS preprocessor adding variables, nesting and mixins on top of plain CSS.',
  Tailwind:
    'Utility-first CSS framework for rapidly building custom, responsive interfaces.',
  Shell:
    'Automation and DevOps glue — build scripts, deployment pipelines and server management.',
  Dockerfile:
    'Container definitions so apps run identically anywhere — local dev through production.',
  Go: 'Fast, compiled language for CLIs, network services and high-performance backends.',
  Rust:
    'Systems-level language focused on memory safety and blazing performance.',
  Java: 'Enterprise-grade OOP language for large applications and Android development.',
  Kotlin: 'Modern JVM language, the preferred language for Android apps.',
  Ruby: 'Elegant scripting language — the language behind Ruby on Rails.',
  C: 'Low-level systems programming — firmware, embedded devices and performance-critical code.',
  'C++': 'High-performance systems and game development with fine-grained control.',
  'C#':
    'Microsoft ecosystem language for .NET apps, games (Unity) and Windows tools.',
  Swift: 'Apples modern language for iOS, macOS and native Apple-platform apps.',
  Dart: 'Language of the Flutter framework for cross-platform mobile and web apps.',
  SQL: 'Query language for relational databases — schemas, migrations and analytics.',
  Vue: 'Progressive JavaScript framework for building reactive single-page apps.',
  Lua: 'Lightweight embeddable scripting — game modding, Neovim config and plugins.',
  PowerShell:
    'Task automation and configuration management for Windows environments.',
  Elixir:
    'Functional language on the BEAM VM — fault-tolerant, concurrent services.',
  Nix: 'Declarative, reproducible configuration for systems and development environments.',
  MDX: 'Markdown plus JSX — documentation sites and interactive content.',
};

const descriptionFor = (language: string): string =>
  LANGUAGE_DESCRIPTIONS[language] ??
  `Used across my repositories — click through to GitHub to see it in action.`;

/**
 * Language icon. Loads the skill-icons SVG and swaps to a themed fallback
 * glyph if that language has no icon available (404 / parse failure).
 */
const LanguageIcon = ({
  language,
  size = 'w-12 h-12',
  lazy = false,
}: {
  language: string;
  size?: string;
  lazy?: boolean;
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${size} rounded-lg bg-base-300/70 border border-base-content/10 flex items-center justify-center text-base-content/60`}
        title={language}
      >
        <MdOutlineExtension className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={skillIconUrl([iconIdFor(language)])}
      alt={language}
      loading={lazy ? 'lazy' : undefined}
      onError={() => setFailed(true)}
      className={size}
    />
  );
};

interface TechStackProps {
  techStack: TechStackEntry[] | null;
  loading: boolean;
}

const TechStack = ({ techStack, loading }: TechStackProps) => {
  const [selected, setSelected] = useState<TechStackEntry | null>(null);

  const renderSkeleton = () => (
    <div className="grid grid-cols-6 xs:grid-cols-6 sm:grid-cols-8 gap-3 max-w-md">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square w-full">
          {skeleton({ widthCls: 'w-full', heightCls: 'h-full', shape: '' })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="card bg-base-200 shadow-xl border border-base-300 mt-6">
      <div className="card-body p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex-shrink-0">
            <MdInfo className="text-xl sm:text-2xl" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-base-content">
              Tech Stack
            </h3>
            <div className="text-base-content/60 text-xs sm:text-sm mt-1">
              Auto-generated from my GitHub repositories — tap an icon for
              details
            </div>
          </div>
        </div>

        {loading || !techStack ? (
          renderSkeleton()
        ) : (
          <>
            {/* Icon grid — fixed columns so it wraps cleanly on any width */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2.5 sm:gap-3">
              {techStack.slice(0, 30).map((entry) => (
                <button
                  key={entry.language}
                  onClick={() => setSelected(entry)}
                  title={entry.language}
                  className={`aspect-square w-full rounded-lg transition-transform hover:scale-110 focus:scale-110 focus:outline-none ${
                    selected?.language === entry.language
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <LanguageIcon language={entry.language} size="w-full h-full" />
                </button>
              ))}
            </div>

            {selected && (
              <div className="mt-4 sm:mt-6 p-4 rounded-xl bg-base-100 border border-base-300">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-12 h-12">
                    <LanguageIcon language={selected.language} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-base-content break-words">
                        {selected.language}
                      </h4>
                      <button
                        onClick={() => setSelected(null)}
                        className="btn btn-ghost btn-xs text-base-content/50"
                      >
                        Close
                      </button>
                    </div>
                    <p className="text-sm text-base-content/70 mt-2">
                      {descriptionFor(selected.language)}
                    </p>
                  </div>
                </div>
                {/* Stats row — wraps to its own line on narrow screens */}
                <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 text-sm">
                  <div>
                    <div className="text-base-content/50 text-xs">Usage</div>
                    <div className="font-semibold text-primary">
                      {selected.percent}%
                    </div>
                  </div>
                  <div>
                    <div className="text-base-content/50 text-xs">Repos</div>
                    <div className="font-semibold text-base-content">
                      {selected.repoCount}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <div className="text-base-content/50 text-xs mb-1">
                      Share of codebase
                    </div>
                    <progress
                      className="progress progress-primary w-full"
                      value={selected.percent}
                      max={100}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TechStack;
