import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { SITE_DESCRIPTION, SITE_NAME } from '../src/lib/seo.ts'

const [regular, bold, theme] = await Promise.all([
  readFile(new URL('../public/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2', import.meta.url)),
  readFile(new URL('../public/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2', import.meta.url)),
  readFile(new URL('../src/styles/theme.css', import.meta.url), 'utf8'),
])
const escapeText = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const output = fileURLToPath(new URL('../public/social-card.png', import.meta.url))
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          ${theme}
          @font-face {
            font-family: "JetBrains Mono";
            font-weight: 400;
            src: url(data:font/woff2;base64,${regular.toString('base64')}) format("woff2");
          }
          @font-face {
            font-family: "JetBrains Mono";
            font-weight: 700;
            src: url(data:font/woff2;base64,${bold.toString('base64')}) format("woff2");
          }
          * { box-sizing: border-box; }
          body {
            margin: 0; width: 1200px; height: 630px; padding: 64px 88px;
            display: flex; flex-direction: column; justify-content: space-between;
            background: var(--theme-bg); color: var(--theme-text); font-family: "JetBrains Mono", monospace;
          }
          .domain { font-size: 22px; color: var(--theme-muted); }
          h1 { margin: 0 0 24px; font-size: 80px; line-height: 1.15; letter-spacing: -3px; }
          p { margin: 0; max-width: 960px; font-size: 25px; line-height: 1.6; }
          footer { border-top: 1px solid var(--theme-rule); padding-top: 24px; font-size: 22px; }
        </style>
      </head>
      <body>
        <div class="domain">raghib.io</div>
        <main>
          <h1>${escapeText(SITE_NAME)}</h1>
          <p>${escapeText(SITE_DESCRIPTION)}</p>
        </main>
        <footer>Software. AI. Systems.</footer>
      </body>
    </html>`)
  await page.evaluate(async () => {
    await document.fonts.ready
    if (!document.fonts.check('700 80px "JetBrains Mono"')) {
      throw new Error('Social card font did not load')
    }
  })
  await page.screenshot({ path: output, type: 'png' })
  console.log(`Generated ${output}`)
} finally {
  await browser.close()
}
