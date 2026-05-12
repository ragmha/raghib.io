import Link from 'next/link'

type Crumb = { label: string; href?: string }

export function WritingHeader({ path }: { path: Crumb[] }) {
  return (
    <header className="mb-10 pb-6 border-b border-surface0/60">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-0.5 font-mono text-base font-bold text-text hover:text-blue transition-colors"
        >
          <span>raghib.io</span>
          <span
            aria-hidden="true"
            className="inline-block w-[0.55em] h-[1em] -mb-0.5 bg-green opacity-80 animate-[caret_1.1s_steps(2)_infinite]"
          />
        </Link>

        <nav
          aria-label="Primary"
          className="font-mono text-xs sm:text-sm text-overlay1 flex items-center gap-2"
        >
          <Link href="/" className="hover:text-text transition-colors">
            home
          </Link>
          <span aria-hidden="true" className="text-surface2">
            /
          </span>
          <Link href="/writing" className="hover:text-text transition-colors">
            writing
          </Link>
          <span aria-hidden="true" className="text-surface2">
            /
          </span>
          <Link href="/projects" className="hover:text-text transition-colors">
            projects
          </Link>
        </nav>
      </div>

      <div className="mt-3 font-mono text-xs sm:text-sm text-overlay1 flex items-center gap-1 flex-wrap">
        <span className="text-green select-none">▸</span>
        {path.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="text-surface2 select-none">
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-text transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-subtext1">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
    </header>
  )
}
