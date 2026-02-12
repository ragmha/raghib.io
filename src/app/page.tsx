import { Hero } from '@/components/hero'
import { Terminal } from '@/components/terminal'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-base to-mantle flex items-center justify-center p-4 sm:p-6 md:p-8 pb-16">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-[1200px] w-full items-center">
        <Hero />
        <Terminal />
      </section>
    </main>
  )
}
