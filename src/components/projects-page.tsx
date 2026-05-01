import type { Metadata } from 'next'
import { fetchGitHubRepos } from '@/lib/github'
import { ProjectCard } from '@/components/project-card'

export const projectsMetadata: Metadata = {
  title: 'Projects — Raghib Hasan',
  description: 'Open-source projects and repositories by Raghib Hasan.',
}

export async function ProjectsPage() {
  const repos = await fetchGitHubRepos('ragmha')

  return (
    <main className="min-h-screen bg-gradient-to-br from-base to-mantle px-4 sm:px-6 md:px-8 py-12 md:py-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10 md:mb-14">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-overlay1 hover:text-text transition-colors mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </a>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text tracking-tight">
            Projects
          </h1>
          <p className="mt-3 text-subtext0 text-base sm:text-lg max-w-2xl">
            Open-source work and side projects — auto-populated from{' '}
            <a
              href="https://github.com/ragmha"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <ProjectCard key={repo.name} repo={repo} />
          ))}
        </div>

        {repos.length === 0 && (
          <p className="text-center text-subtext0 py-20">
            No projects found.
          </p>
        )}
      </div>
    </main>
  )
}
