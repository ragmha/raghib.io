import Link from 'next/link'

export function CtaSection() {
  return (
    <div className="flex flex-col gap-8">
      {/* CTA Button */}
      <Link
        href="/blog"
        className="group flex items-center gap-4 p-5 rounded-lg border-2 border-blue bg-gradient-to-br from-mantle to-base transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(137,180,250,0.3)] hover:border-green no-underline"
      >
        <span className="text-3xl">👨‍💻</span>
        <div className="flex flex-col gap-1 flex-grow">
          <span className="text-lg font-semibold text-blue">
            Explore My Blog
          </span>
          <span className="text-sm text-overlay1">
            Thoughts on AI, engineering & developer tools
          </span>
        </div>
        <span className="text-xl text-green transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>

      {/* Quick info stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="text-center p-4 bg-base rounded-md border border-surface0">
          <span className="block text-3xl font-bold text-yellow mb-1">4</span>
          <span className="text-xs text-overlay1 uppercase tracking-wider">
            AI Tools
          </span>
        </div>
        <div className="text-center p-4 bg-base rounded-md border border-surface0">
          <span className="block text-3xl font-bold text-yellow mb-1">∞</span>
          <span className="text-xs text-overlay1 uppercase tracking-wider">
            Possibilities
          </span>
        </div>
        <div className="text-center p-4 bg-base rounded-md border border-surface0">
          <span className="block text-3xl font-bold text-yellow mb-1">1</span>
          <span className="text-xs text-overlay1 uppercase tracking-wider">
            Terminal
          </span>
        </div>
      </div>
    </div>
  )
}
