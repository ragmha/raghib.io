import type { GitHubRepo } from '@/lib/github'

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue text-crust',
  JavaScript: 'bg-yellow text-crust',
  Python: 'bg-green text-crust',
  Rust: 'bg-peach text-crust',
  Go: 'bg-teal text-crust',
  Java: 'bg-red text-crust',
  HTML: 'bg-pink text-crust',
  CSS: 'bg-mauve text-crust',
  Shell: 'bg-green text-crust',
  Swift: 'bg-peach text-crust',
  Ruby: 'bg-red text-crust',
  'C#': 'bg-mauve text-crust',
  C: 'bg-overlay1 text-crust',
  'C++': 'bg-pink text-crust',
}

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ProjectCard({ repo }: { repo: GitHubRepo }) {
  const langColor = LANGUAGE_COLORS[repo.language ?? ''] ?? 'bg-surface1 text-text'

  return (
    <div className="group relative rounded-lg border border-surface0 bg-mantle p-5 transition-all duration-300 hover:border-surface1 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-text font-semibold text-base leading-tight">
          {formatRepoName(repo.name)}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {repo.homepage && (
            <a
              href={repo.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-overlay1 hover:text-blue transition-colors"
              aria-label={`Live demo for ${repo.name}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-overlay1 hover:text-text transition-colors"
            aria-label={`GitHub repo for ${repo.name}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>

      {repo.description && (
        <p className="text-subtext0 text-sm leading-relaxed mb-4 line-clamp-2">
          {repo.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {repo.language && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${langColor}`}
          >
            {repo.language}
          </span>
        )}
        {repo.topics.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center rounded-full bg-surface0 px-2.5 py-0.5 text-xs text-subtext1"
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  )
}
