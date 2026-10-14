for (const figure of document.querySelectorAll<HTMLElement>('[data-anatomy]')) {
  const controls = figure.querySelector<HTMLElement>('.anatomy-controls')
  const buttons = figure.querySelectorAll<HTMLButtonElement>('button[data-step]')
  const readout = figure.querySelector<HTMLElement>('.anatomy-readout')
  if (!readout) throw new Error('Decision figure has no readout')

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const step = button.dataset.step
      const detail = button.dataset.detail
      if (step === undefined || detail === undefined) {
        throw new Error('Decision figure control has no state')
      }
      for (const control of buttons) {
        control.setAttribute('aria-pressed', String(control === button))
      }
      for (const station of figure.querySelectorAll<SVGElement>('[data-station]')) {
        station.toggleAttribute('data-selected', station.dataset.station === step)
      }
      for (const item of figure.querySelectorAll<HTMLElement>('[data-key-step]')) {
        item.toggleAttribute('data-selected', item.dataset.keyStep === step)
      }
      for (const indicator of figure.querySelectorAll<SVGElement>('[data-indicator]')) {
        indicator.setAttribute('visibility', indicator.dataset.indicator === step ? 'visible' : 'hidden')
      }
      readout.textContent = detail
    })
  }
  if (!controls) throw new Error('Decision figure has no controls')
  controls.hidden = false
}
