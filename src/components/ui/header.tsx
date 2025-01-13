import Link from 'next/link'
import { ModeToggle } from './mode-toggle'

export function Header() {
  return (
    <header>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-gray-800 dark:text-gray-200"
        >
          Raghib
        </Link>
        <nav className="space-x-4">
          <Link
            href="/blog"
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Blog
          </Link>
          <Link
            href="/projects"
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Projects
          </Link>
          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}
