export function TerminalShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-surface0 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-mantle border-b border-surface0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink" />
          <span className="w-3 h-3 rounded-full bg-yellow" />
          <span className="w-3 h-3 rounded-full bg-green" />
        </div>
        <span className="text-sm text-overlay1 font-mono">{title}</span>
        <div className="w-[52px]" />
      </div>
      <div className="bg-base font-mono text-sm leading-relaxed">{children}</div>
    </div>
  )
}
