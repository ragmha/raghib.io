import Link from 'next/link'

export function Hero() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-blue mb-2 drop-shadow-[0_0_20px_rgba(137,180,250,0.4)]">
          Raghib Hasan
        </h1>
        <h2 className="text-xl font-medium text-pink">
          Solution Engineer at Microsoft
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-green drop-shadow-[0_0_10px_rgba(166,227,161,0.3)]">
          Welcome to my corner of the internet.
        </p>
        <p className="text-base leading-relaxed text-subtext1 max-w-[600px]">
          Building at the intersection of AI and developer experience.
          Exploring how tools like GitHub Copilot, Claude Code, Codex, and
          OpenCode are reshaping the way we write software.
        </p>
      </div>
    </div>
  )
}
