import { mkdtemp, readFile, rm, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { marpCli } from '@marp-team/marp-cli'

export async function renderPresentation(source: string, canonical: URL): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'raghib-talk-'))
  const output = join(directory, 'presentation.html')

  try {
    const status = await marpCli([
      source,
      '--output', output,
      '--html',
      '--no-config-file',
      '--theme', 'src/styles/talk-theme.css',
      '--no-bespoke.transition',
      '--url', canonical.href,
    ])
    if (status !== 0) throw new Error(`Presentation render failed for ${source}`)

    const [html, tokens, themeController] = await Promise.all([
      readFile(output, 'utf8'),
      readFile('src/styles/theme.css', 'utf8'),
      readFile('src/scripts/theme.js', 'utf8'),
    ])
    return html
      .replace('</head>', `
        <meta name="robots" content="noindex">
        <style>
          ${tokens}
          body { background: var(--theme-bg); color: var(--theme-text); }
          #theme-toggle {
            position: fixed; top: 16px; right: 16px; z-index: 20;
            min-width: 44px; min-height: 44px; padding: 0 16px;
            border: 1px solid var(--theme-rule-strong); border-radius: 0;
            background: var(--theme-bg); color: var(--theme-text);
            font: 14px "JetBrains Mono", ui-monospace, monospace; cursor: pointer;
          }
          #theme-toggle:hover { background: var(--theme-surface); }
          .bespoke-marp-active { animation: talk-slide-in 200ms ease-out; }
          @keyframes talk-slide-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @media print { #theme-toggle { display: none; } }
          @media (prefers-reduced-motion: reduce) {
            .bespoke-marp-active { animation: none; }
          }
        </style>
        <script>
          (() => {
            const root = document.documentElement;
            root.dataset.themeDefault = 'dark';
            root.dataset.theme = 'dark';
            try {
              if (localStorage.getItem('theme') === 'light') root.dataset.theme = 'light';
            } catch {
              // Keep the page default when browser storage is unavailable.
            }
          })();
        </script>
      </head>`)
      .replace('</body>', `
        <button id="theme-toggle" type="button" aria-label="Switch to light mode" hidden>
          <span data-theme-label>LIGHT</span>
        </button>
        <script>(() => {
          if (window.self !== window.top) document.getElementById('theme-toggle').remove();
          ${themeController}
        })();</script>
      </body>`)
  } finally {
    await rm(output, { force: true })
    await rmdir(directory)
  }
}
