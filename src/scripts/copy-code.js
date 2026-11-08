document.querySelectorAll('.prose pre > code').forEach((code, index) => {
  const pre = code.parentElement
  const controls = document.createElement('span')
  controls.className = 'code-controls'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Copy'
  button.setAttribute('aria-label', `Copy code example ${index + 1}`)
  const status = document.createElement('span')
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  controls.append(status, button)
  pre.append(controls)

  let pending = false
  button.addEventListener('click', async () => {
    if (pending) return
    pending = true
    status.textContent = ''
    try {
      await navigator.clipboard.writeText(code.textContent ?? '')
      status.textContent = 'Copied!'
    } catch (error) {
      status.textContent = 'Copy failed. Select the code and copy manually.'
      console.error('Could not copy code to the clipboard.', error)
    } finally {
      pending = false
    }
  })
})
