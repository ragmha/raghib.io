// Inlined before the article so the compact rail is established before paint.
;(() => {
  const sidebar = document.currentScript?.closest('.sidebar')
  const toggle = sidebar?.querySelector('[data-contents-toggle]')

  if (!sidebar || !toggle) {
    console.error('Contents disclosure is missing its sidebar or toggle.')
    return
  }

  function setExpanded(expanded) {
    sidebar.dataset.expanded = String(expanded)
    toggle.setAttribute('aria-expanded', String(expanded))
  }

  sidebar.dataset.enhanced = ''
  toggle.hidden = false
  toggle.addEventListener('click', () => {
    if (sidebar.dataset.enhanced === undefined) return
    setExpanded(sidebar.dataset.expanded !== 'true')
  })
  sidebar.addEventListener('keydown', (event) => {
    if (sidebar.dataset.enhanced === undefined || event.key !== 'Escape') return
    setExpanded(false)
    toggle.focus({ preventScroll: true })
  })
  sidebar.addEventListener('click', (event) => {
    if (sidebar.dataset.enhanced === undefined || !event.target.closest('[data-part-link]')) return
    setExpanded(false)
    toggle.focus({ preventScroll: true })
  })
  document.addEventListener('pointerdown', (event) => {
    if (sidebar.dataset.enhanced !== undefined && !sidebar.contains(event.target)) {
      setExpanded(false)
    }
  })
})()
