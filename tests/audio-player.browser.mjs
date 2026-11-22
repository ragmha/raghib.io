import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium } from 'playwright'

const url = process.env.AUDIO_PLAYER_TEST_URL

test(
  'published narration plays, seeks, and switches voices',
  {
    skip: !url,
    timeout: 30000,
  },
  async () => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      const player = page.getByRole('group', { name: 'Article audio' })
      await player.waitFor({ timeout: 5000 })
      assert.equal(await player.count(), 1)
      const audio = player.locator('audio')
      const seek = player.getByRole('slider', {
        name: 'Seek through article audio',
      })
      await page.waitForFunction(() => {
        const audio = document.querySelector('[data-audio-player] audio')
        return audio?.duration > 0
      })
      await player.getByRole('button', { name: 'Play article audio' }).click()
      await page.waitForFunction(
        () => document.querySelector('audio').currentTime > 0,
      )
      assert.equal(await audio.evaluate((element) => element.paused), false)
      await seek.evaluate((element) => {
        element.value = '60'
        element.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await page.waitForFunction(
        () => document.querySelector('audio').currentTime >= 60,
      )
      for (const voice of ['michael', 'heart']) {
        await player
          .getByRole('combobox', { name: 'Narration voice' })
          .selectOption(voice)
        const expectedPath =
          new URL(url).pathname
            .replace('/writing/', '/audio/')
            .replace(/\/$/, '') +
          (voice === 'michael' ? '-am_michael.mp3' : '.mp3')
        await page.waitForFunction((path) => {
          const audio = document.querySelector('[data-audio-player] audio')
          return (
            audio.currentSrc.endsWith(path) &&
            !audio.paused &&
            audio.currentTime > 60 &&
            audio.error === null
          )
        }, expectedPath)
        assert.equal(await seek.isEnabled(), true)
        assert.equal(await player.locator('[data-status]').isVisible(), false)
      }
      await player.getByRole('button', { name: 'Pause article audio' }).click()
      assert.equal(await audio.evaluate((element) => element.paused), true)
    } finally {
      await browser.close()
    }
  },
)
