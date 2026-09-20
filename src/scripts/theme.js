// Progressive enhancement only — the page is fully readable with JS disabled.
// Ported from the closed static-generator prototype (PR #17). Diagram runtime
// hydration is intentionally omitted from this writing-only layout.
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
  } catch {
    // Storage may be unavailable (private mode); theme still applies for
    // this page load.
  }
  paintToggle()
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
  } catch {
    // Ignore storage access errors.
  }
  if (!saved) {
    root.dataset.theme = e.matches ? 'dark' : 'light'
    paintToggle()
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
