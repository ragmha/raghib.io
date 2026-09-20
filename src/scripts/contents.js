import { activeSection, railPosition } from '../lib/reading-progress.mjs'

const nav = document.querySelector('[data-contents-nav]')
const article = document.querySelector('main article')
const marker = nav?.querySelector('[data-reading-window]')

if (nav && article && marker) {
  const links = [...nav.querySelectorAll('[data-part-link]')]
  const entries = links.map((link) => ({
    link,
    target: document.getElementById(link.dataset.partLink),
  }))
  const missing = entries.filter(({ target }) => !target)

  if (missing.length) {
    console.error('Contents links have no matching article headings:', missing.map(({ link }) => link.hash))
  } else {
    const sidebar = nav.closest('.sidebar')
    const header = document.querySelector('.site-header')
    const desktop = matchMedia('(min-width: 96rem)')
    let points = []
    let positions = []
    let active = -1
    let queued = false
    let needsMeasure = true
    let anchorOffset = 0

    function measure() {
      const navTop = nav.getBoundingClientRect().top
      positions = entries.map(({ target }) => target.getBoundingClientRect().top + scrollY)
      points = entries.map(({ link }, index) => ({
        documentY: positions[index],
        railY: index === 0 ? 0 : link.getBoundingClientRect().top - navTop + 16,
      }))
      points.push({
        documentY: article.getBoundingClientRect().bottom + scrollY,
        railY: nav.offsetHeight,
      })
      anchorOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      needsMeasure = false
    }

    function sync() {
      queued = false
      if (needsMeasure) measure()
      const readingTop = scrollY + Math.max(
        (header?.getBoundingClientRect().bottom ?? 0) + 16,
        anchorOffset,
      ) + 1
      const next = activeSection(positions, readingTop)
      if (next !== active) {
        active = next
        for (const [index, { link }] of entries.entries()) {
          if (index === active) link.setAttribute('aria-current', 'location')
          else link.removeAttribute('aria-current')
        }

        // Follow long contents lists without interrupting someone using the nav.
        if (sidebar && desktop.matches && !nav.matches(':hover, :focus-within')) {
          const linkRect = entries[active].link.getBoundingClientRect()
          const viewport = sidebar.getBoundingClientRect()
          if (linkRect.top < viewport.top || linkRect.bottom > viewport.bottom) {
            sidebar.scrollTop += linkRect.top - viewport.top - sidebar.clientHeight / 2
          }
        }
      }
      const start = railPosition(points, readingTop)
      const end = railPosition(points, scrollY + innerHeight)
      const height = Math.min(Math.max(4, end - start), nav.offsetHeight)
      const offset = Math.min(start, Math.max(0, nav.offsetHeight - height))
      marker.style.transform = `translateY(${offset}px) scaleY(${height})`
      nav.dataset.enhanced = ''
    }

    function schedule(remeasure = false) {
      needsMeasure ||= remeasure
      if (queued) return
      queued = true
      // Background tabs can restore hashes while animation frames are suspended.
      if (document.hidden) setTimeout(sync, 0)
      else requestAnimationFrame(sync)
    }

    addEventListener('scroll', () => schedule(), { passive: true })
    addEventListener('resize', () => schedule(true))
    addEventListener('hashchange', () => schedule(true))
    addEventListener('pageshow', () => schedule(true))
    document.addEventListener('visibilitychange', () => schedule(true))
    const observer = new ResizeObserver(() => schedule(true))
    observer.observe(article)
    observer.observe(nav)
    if (header) observer.observe(header)
    document.fonts.ready.then(() => schedule(true))
    sync()
  }
}
