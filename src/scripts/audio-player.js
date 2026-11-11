for (const player of document.querySelectorAll('[data-audio-player]')) {
  const audio = player.querySelector('audio')
  const play = player.querySelector('[data-play]')
  const seek = player.querySelector('[data-seek]')
  const time = player.querySelector('[data-time]')
  const speed = player.querySelector('[data-speed]')
  const voice = player.querySelector('[data-voice]')
  const status = player.querySelector('[data-status]')
  const voices = {
    heart: player.dataset.voiceHeart,
    michael: player.dataset.voiceMichael,
  }
  const preferenceKey = 'article-audio-voice'
  const savedVoice = localStorage.getItem(preferenceKey)
  let resumeAfterVoiceChange = false
  let resumeAt = 0

  if (Object.hasOwn(voices, savedVoice)) {
    voice.value = savedVoice
    audio.src = voices[savedVoice]
  }

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '--:--'
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  }

  const updateTime = () => {
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
    seek.value = audio.currentTime
    const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
    seek.style.setProperty('--audio-progress', `${progress}%`)
  }

  audio.addEventListener('loadedmetadata', () => {
    seek.max = audio.duration
    seek.disabled = false
    audio.currentTime = Math.min(resumeAt, audio.duration)
    updateTime()
    if (resumeAfterVoiceChange) {
      resumeAfterVoiceChange = false
      audio.play().catch(() => {
        status.hidden = false
        status.textContent = 'Audio could not be played in this browser.'
      })
    }
  })

  audio.addEventListener('timeupdate', updateTime)
  audio.addEventListener('play', () => {
    player.dataset.playing = 'true'
    play.setAttribute('aria-label', 'Pause article audio')
  })
  audio.addEventListener('pause', () => {
    delete player.dataset.playing
    play.setAttribute('aria-label', 'Play article audio')
  })
  audio.addEventListener('ended', () => {
    audio.currentTime = 0
    updateTime()
  })
  audio.addEventListener('error', () => {
    status.hidden = false
    status.textContent = 'Audio could not be loaded. Reload the page to try again.'
    play.disabled = true
    seek.disabled = true
  })

  play.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        status.hidden = false
        status.textContent = 'Audio could not be played in this browser.'
      })
    } else {
      audio.pause()
    }
  })

  seek.addEventListener('input', () => {
    audio.currentTime = Number(seek.value)
  })

  speed.addEventListener('change', () => {
    audio.playbackRate = Number(speed.value)
  })

  voice.addEventListener('change', () => {
    if (!Object.hasOwn(voices, voice.value) || audio.src.endsWith(voices[voice.value])) return
    resumeAt = audio.currentTime
    resumeAfterVoiceChange = !audio.paused
    audio.pause()
    audio.src = voices[voice.value]
    play.disabled = false
    seek.disabled = true
    status.hidden = true
    localStorage.setItem(preferenceKey, voice.value)
    audio.load()
  })
}
