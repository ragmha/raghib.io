import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

// Checks the Agent Skills specification (https://agentskills.io/specification).
// The lanes job runs this with plain `node --test` before dependencies are installed.
const root = new URL('../.agents/skills/', import.meta.url)

const frontmatter = (source) => {
  const block = source.match(/^---\n([\s\S]*?)\n---\n/)?.[1]
  assert.ok(block, 'SKILL.md starts with YAML frontmatter')
  return Object.fromEntries(block.split('\n')
    .map((line) => line.match(/^([\w-]+):\s*(.*)$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.trim().replace(/^(['"])(.*)\1$/, '$2')]))
}

const skills = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)

for (const skill of skills) {
  test(`${skill} is a valid Agent Skill`, () => {
    const dir = new URL(`${skill}/`, root)
    const source = readFileSync(new URL('SKILL.md', dir), 'utf8').replace(/\r\n/g, '\n')
    const { name, description = '' } = frontmatter(source)
    assert.equal(name, skill, 'name matches the folder')
    assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/, 'name uses lowercase letters, digits, and single hyphens')
    assert.ok(name.length <= 64, 'name has at most 64 characters')
    assert.doesNotMatch(description, /^[>|]?$/, 'description is a nonempty single-line string')
    assert.ok(description.length <= 1024, 'description has at most 1024 characters')

    for (const [, target] of source.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      if (!/^[a-z][a-z+.-]*:/i.test(target)) assert.ok(existsSync(new URL(target, dir)), `link to ${target} resolves`)
    }

    const evalsFile = new URL('evals/evals.json', dir)
    if (existsSync(evalsFile)) {
      const evals = JSON.parse(readFileSync(evalsFile, 'utf8'))
      assert.equal(evals.skill_name, skill, 'evals name their skill')
      assert.ok(evals.evals.length > 0, 'evals list at least one case')
      for (const item of evals.evals) {
        assert.ok(item.prompt && item.expected_output && item.assertions?.length, `eval ${item.id} has a prompt, expected output, and assertions`)
      }
    }
  })
}
