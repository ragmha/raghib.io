'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong.</h2>
        <button
          onClick={reset}
          className="px-4 py-2 rounded border border-surface0 bg-mantle hover:bg-surface0 transition-colors"
        >
          Try again
        </button>
        <p className="text-xs text-subtext0">{error.digest ? `Ref: ${error.digest}` : ''}</p>
      </div>
    </main>
  )
}
