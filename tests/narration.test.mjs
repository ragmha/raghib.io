import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const writingDir = new URL('src/content/writing/', root)
const audioDir = new URL('public/audio/', root)

test('every published article has generated audio for both voices', () => {
  const posts = readdirSync(writingDir).filter((file) => file.endsWith('.mdx'))
  const published = posts.filter((file) => {
    const source = readFileSync(new URL(file, writingDir), 'utf8')
    return !/^published:\s*false\s*$/m.test(source)
  })

  for (const post of published) {
    const slug = post.slice(0, -4)
    for (const voice of ['', '-am_michael']) {
      const audio = new URL(`${slug}${voice}.mp3`, audioDir)
      assert.ok(existsSync(audio), `${post} is missing narration ${voice || '(heart)'}`)
      assert.ok(statSync(audio).size > 1000, `${post} has empty narration ${voice || '(heart)'}`)
    }
  }
})

const narration = (flag) =>
  spawnSync('python3', ['scripts/generate-narration.py', flag], { cwd: root, encoding: 'utf8' })

test('narration text extraction skips markdown syntax and code', () => {
  const result = narration('--check')
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('narration audio matches the current article text', () => {
  const result = narration('--stale')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), '', `Stale narration, run bun run narration:generate:\n${result.stdout}`)
})
