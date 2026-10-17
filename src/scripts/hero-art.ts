// Covers load their illustration after the title so it doesn't delay LCP; inlining it keeps theme styles.
for (const art of document.querySelectorAll<HTMLElement>('.decision-hero-art[data-src]')) {
  fetch(art.dataset.src!)
    .then((response) => (response.ok ? response.text() : Promise.reject()))
    .then((svg) => {
      art.innerHTML = svg
      art.hidden = false
      art.closest('.decision-cover')?.classList.add('has-illustration')
    })
    .catch(() => {})
}
