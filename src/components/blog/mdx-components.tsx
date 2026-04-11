import type { MDXComponents } from 'mdx/types'
import { ProjectCard } from '@/components/project-card'
import type { GitHubRepo } from '@/lib/github'

function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warn' | 'error'
  children: React.ReactNode
}) {
  const config = {
    info: { label: 'INFO', color: 'text-blue', border: 'border-blue' },
    warn: { label: 'WARN', color: 'text-yellow', border: 'border-yellow' },
    error: { label: 'ERROR', color: 'text-red', border: 'border-red' },
  }
  const { label, color, border } = config[type]

  return (
    <div
      className={`my-6 border-l-2 ${border} bg-mantle rounded-r-lg p-4 font-mono text-sm`}
    >
      <span className={`${color} font-bold text-xs`}>[{label}]</span>
      <div className="mt-1 text-subtext1 leading-relaxed">{children}</div>
    </div>
  )
}

function RepoCard({
  name,
  description,
  url,
  homepage,
  language,
  topics,
}: {
  name: string
  description?: string
  url: string
  homepage?: string
  language?: string
  topics?: string
}) {
  const repo: GitHubRepo = {
    name,
    description: description ?? null,
    html_url: url,
    homepage: homepage ?? null,
    language: language ?? null,
    topics: topics ? topics.split(',').map((t) => t.trim()) : [],
    stargazers_count: 0,
    fork: false,
    archived: false,
    pushed_at: new Date().toISOString(),
  }
  return (
    <div className="my-6">
      <ProjectCard repo={repo} />
    </div>
  )
}

export function getMDXComponents(): MDXComponents {
  return {
    h1: ({ children, id }) => (
      <h1
        id={id}
        className="text-2xl font-bold text-text mt-10 mb-4 font-mono"
      >
        <span className="text-green select-none"># </span>
        {children}
      </h1>
    ),
    h2: ({ children, id }) => (
      <h2
        id={id}
        className="text-xl font-bold text-text mt-8 mb-3 font-mono group"
      >
        <a href={`#${id}`} className="no-underline">
          <span className="text-green select-none">## </span>
          {children}
          <span className="text-surface2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            #
          </span>
        </a>
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3
        id={id}
        className="text-lg font-bold text-text mt-6 mb-2 font-mono group"
      >
        <a href={`#${id}`} className="no-underline">
          <span className="text-green select-none">### </span>
          {children}
          <span className="text-surface2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            #
          </span>
        </a>
      </h3>
    ),
    h4: ({ children, id }) => (
      <h4 id={id} className="text-base font-bold text-text mt-4 mb-2 font-mono">
        <span className="text-green select-none">#### </span>
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-subtext1 leading-7 mb-4 font-mono text-sm">
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue underline underline-offset-2 hover:text-lavender transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="text-subtext1 font-mono text-sm mb-4 space-y-1 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="text-subtext1 font-mono text-sm mb-4 space-y-1 ml-4 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-7">
        <span className="text-green select-none">* </span>
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-green pl-4 my-4 italic text-overlay1 font-mono text-sm">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-8 border-none text-center text-surface2 font-mono text-sm before:content-['────────────────────────────────']" />
    ),
    code: ({ children, className }) => {
      // Inline code (no className means it's not a code block processed by rehype-pretty-code)
      if (!className) {
        return (
          <code className="bg-surface0 text-peach px-1.5 py-0.5 rounded text-[13px] font-mono">
            {children}
          </code>
        )
      }
      // Code blocks are handled by rehype-pretty-code, just pass through
      return <code className={className}>{children}</code>
    },
    pre: ({ children, ...props }) => (
      <div className="my-6 rounded-lg border border-surface0 overflow-hidden">
        <div className="flex items-center px-3 py-1.5 bg-mantle border-b border-surface0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow" />
            <span className="w-2.5 h-2.5 rounded-full bg-green" />
          </div>
        </div>
        <pre
          {...props}
          className="bg-crust p-4 overflow-x-auto text-sm leading-relaxed font-mono"
        >
          {children}
        </pre>
      </div>
    ),
    img: ({ src, alt }) => (
      <figure className="my-6">
        <img
          src={src}
          alt={alt ?? ''}
          className="rounded-lg border border-surface0 w-full"
        />
        {alt && (
          <figcaption className="text-center text-xs text-overlay1 mt-2 font-mono">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-text">{children}</strong>
    ),
    em: ({ children }) => <em className="text-lavender italic">{children}</em>,
    Callout,
    RepoCard,
  }
}
