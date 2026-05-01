import type { Metadata } from 'next'
import { Hero } from '@/components/hero'
import { Terminal } from '@/components/terminal'
import {
  ProjectsPage,
  projectsMetadata,
} from '@/components/projects-page'

type Props = {
  searchParams: Promise<{ _page?: string }>
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams
  if (params._page === 'projects') return projectsMetadata
  return {
    title: 'Raghib Hasan',
    description: 'Solution Engineer at Microsoft',
  }
}

function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-base to-mantle flex items-center justify-center p-4 sm:p-6 md:p-8 pb-16">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-[1200px] w-full items-center">
        <Hero />
        <Terminal />
      </section>
    </main>
  )
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams
  if (params._page === 'projects') return <ProjectsPage />
  return <HomePage />
}
