// Progressive enhancement only — the page is fully readable with JS disabled.
const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

const root = document.documentElement
const currentTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light')

/* ------------------------------------------------------------- theme */

const toggle = document.getElementById('theme-toggle')
const label = toggle?.querySelector('[data-theme-label]')

function paintToggle() {
  if (!toggle || !label) return
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  label.textContent = next.toUpperCase()
  toggle.setAttribute('aria-label', `Switch to ${next} mode`)
  toggle.title = `Switch to ${next} mode`
}

function setTheme(theme) {
  root.dataset.theme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch {}
  paintToggle()
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
}

paintToggle()
toggle?.addEventListener('click', () =>
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
)

// Follow the OS only while the visitor has not made an explicit choice.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let saved = null
  try {
    saved = localStorage.getItem('theme')
  } catch {}
  if (!saved) {
    root.dataset.theme = e.matches ? 'dark' : 'light'
    paintToggle()
    document.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme: currentTheme() } })
    )
  }
})

/* --------------------------------------------------------- scroll spy */

const parts = [...document.querySelectorAll('.part[id]')]
const partLinks = new Map(
  [...document.querySelectorAll('[data-part-link]')].map((a) => [
    a.dataset.partLink,
    a,
  ])
)

if (parts.length && partLinks.size) {
  let ticking = false

  const sync = () => {
    ticking = false
    let active = parts[0]
    for (const part of parts) {
      if (part.getBoundingClientRect().top <= 140) active = part
    }
    for (const [id, link] of partLinks) link.classList.toggle('is-active', id === active.id)
  }

  addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(sync)
    },
    { passive: true }
  )
  sync()
}

/* ---------------------------------------------------------- diagrams */

if (document.body.dataset.diagrams === 'true') {
  const nodes = [...document.querySelectorAll('pre.mermaid')]
  const sources = new WeakMap(nodes.map((n) => [n, n.textContent]))

  const themeVariables = {
    light: {
      background: '#f2f0e7',
      primaryColor: '#faf9f5',
      primaryTextColor: '#1c1b18',
      primaryBorderColor: '#1c1b18',
      secondaryColor: '#e9f56c',
      secondaryBorderColor: '#1c1b18',
      tertiaryColor: '#f1efe6',
      tertiaryBorderColor: '#c9c5b6',
      lineColor: '#6f6d63',
      textColor: '#1c1b18',
      mainBkg: '#faf9f5',
    },
    dark: {
      background: '#1e1e1b',
      primaryColor: '#1e1e1b',
      primaryTextColor: '#e7e5dc',
      primaryBorderColor: '#918e83',
      secondaryColor: '#cede3f',
      secondaryBorderColor: '#918e83',
      tertiaryColor: '#161614',
      tertiaryBorderColor: '#3d3c35',
      lineColor: '#918e83',
      textColor: '#e7e5dc',
      mainBkg: '#1e1e1b',
    },
  }

  try {
    const { default: mermaid } = await import(MERMAID_URL)

    const draw = async () => {
      const theme = currentTheme()
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        darkMode: theme === 'dark',
        fontFamily: getComputedStyle(root).getPropertyValue('--font-mono'),
        themeVariables: themeVariables[theme],
        flowchart: { curve: 'basis', useMaxWidth: true },
      })
      for (const node of nodes) {
        node.removeAttribute('data-processed')
        node.innerHTML = sources.get(node)
      }
      await mermaid.run({ nodes })
    }

    await draw()
    document.addEventListener('themechange', () => {
      draw().catch(console.error)
    })
  } catch (err) {
    // Diagram engine unavailable (offline, blocked CDN): show the source instead.
    for (const node of nodes) node.style.visibility = 'visible'
    console.error('mermaid failed to load', err)
  }
}
