// Game logic for /experiments/100-shots/, shared by the page script and the tests.
// Framework: Jay Yang, "How to Build Your Dream Life", https://x.com/Jayyanginspires/status/2110733530321879482
export const STATUSES = ['idea', 'researching', 'pitched', 'replied', 'won', 'declined', 'no reply'] as const
export type Status = (typeof STATUSES)[number]

export const FILTERS = [
  ['work', 'Their work: I’d consume it for free'],
  ['life', 'Their life: I admire how they spend their time'],
  ['ideas', 'Their ideas: I believe in their message'],
] as const
export const ROUTES = [
  ['r_referral', 'Referral / warm intro'],
  ['r_cold', 'Cold outreach to their team'],
  ['r_content', '30 days of content proving you can do the job'],
  ['r_public', 'Public pitch video, tag them'],
] as const
type Flag = (typeof FILTERS)[number][0] | (typeof ROUTES)[number][0]
export type Text = 'name' | 'link' | 'audit' | 'offer' | 'lesson'

export type Target = { id: string; name: string; status: Status; created: string } & Partial<
  Record<Flag, boolean> & Record<Exclude<Text, 'name'> | 'updated' | 'shotAt', string>
>

export const SHOTS = new Set<Status>(STATUSES.slice(2))
export const REPLIES = new Set<Status>(['replied', 'won', 'declined'])
export const NOS = new Set<Status>(['declined', 'no reply'])
export const STEPS = ['Pick', 'Audit', 'Match', 'Reach out'] as const
export const XP = { pick: 10, audit: 15, match: 15, route: 5, shot: 25, reply: 25, yes: 100, lesson: 20 }

export const SAY: Partial<Record<Status, (name: string) => string>> = {
  replied: (n) => `${n} replied. Keep the momentum.`,
  won: (n) => `${n} said yes! Opportunities → leverage → freedom.`,
  declined: () => 'A no still sharpened your offer. Log what you learned.',
  'no reply': () => 'Silence is data too. Log the lesson, then take the next shot.',
}
export const MILESTONES: Record<number, string> = {
  1: 'You can’t control one yes, only how many good shots you take.',
  10: 'Each shot sharpens the skill and the offer.',
  25: 'A quarter of the way. Doing the work in public attracts other opportunities.',
  50: 'Halfway to 100.',
  75: '75 down. Raise the odds, finish the 100.',
  100: 'Look at what they gave back: skills, proof, connections.',
}

// Opportunities → leverage for options → freedom.
export const LEVELS = [
  [0, 'Dreamer'], [50, 'Scout'], [150, 'Auditor'], [300, 'Matchmaker'], [600, 'Shooter'],
  [1000, 'Closer'], [1600, 'Operator'], [2500, 'Leveraged'], [4000, 'Optionality'], [6000, 'Free'],
] as const

export type Stats = {
  shots: Target[]; streak: number; best: number; xp: number; level: ReturnType<typeof levelOf>
  replies: number; wins: number; lessons: number; picked: number; quadrant: boolean
}
export type Tally = Stats & { unlocked: Set<string> }
export const ACHIEVEMENTS: { id: string; title: string; hint: string; test: (s: Stats) => boolean }[] = [
  { id: 'pick', title: 'First pick', hint: 'A target passes all three filters', test: (s) => s.picked >= 1 },
  { id: 'shot', title: 'First shot', hint: 'Reach out to someone', test: (s) => s.shots.length >= 1 },
  { id: 'quadrant', title: 'Full quadrant', hint: 'Use all four contact routes on one target', test: (s) => s.quadrant },
  { id: 'reply', title: 'First reply', hint: 'Someone writes back', test: (s) => s.replies >= 1 },
  { id: 'yes', title: 'First yes', hint: 'Someone says yes', test: (s) => s.wins >= 1 },
  { id: 'ten', title: 'Double digits', hint: 'Take 10 shots', test: (s) => s.shots.length >= 10 },
  { id: 'lessons', title: 'Student of no', hint: 'Log 5 lessons', test: (s) => s.lessons >= 5 },
  { id: 'streak3', title: 'On a roll', hint: 'Shoot 3 days in a row', test: (s) => s.best >= 3 },
  { id: 'quarter', title: 'Quarter way', hint: 'Take 25 shots', test: (s) => s.shots.length >= 25 },
  { id: 'streak7', title: 'Week of shots', hint: 'Shoot 7 days in a row', test: (s) => s.best >= 7 },
  { id: 'half', title: 'Halfway', hint: 'Take 50 shots', test: (s) => s.shots.length >= 50 },
  { id: 'century', title: '100 shots', hint: 'Take all 100 shots', test: (s) => s.shots.length >= 100 },
]

export const steps = (t: Target) => [
  FILTERS.every(([k]) => t[k]), !!t.audit?.trim(), !!t.offer?.trim(), SHOTS.has(t.status),
]

export function xpOf(t: Target) {
  const [pick, audit, match, shot] = steps(t)
  return (pick ? XP.pick : 0) + (audit ? XP.audit : 0) + (match ? XP.match : 0)
    + ROUTES.filter(([k]) => t[k]).length * XP.route + (shot ? XP.shot : 0)
    + (REPLIES.has(t.status) ? XP.reply : 0) + (t.status === 'won' ? XP.yes : 0) + (t.lesson?.trim() ? XP.lesson : 0)
}

export function levelOf(xp: number) {
  const i = LEVELS.findLastIndex(([min]) => xp >= min)
  const next = LEVELS[i + 1]
  return { n: i + 1, title: LEVELS[i][1], floor: LEVELS[i][0], next: next?.[0], nextTitle: next?.[1] }
}

const day = (d: string | Date) => new Date(d).toLocaleDateString('sv')
const plusDay = (k: string, n: number) => { const d = new Date(k + 'T12:00'); d.setDate(d.getDate() + n); return day(d) }

export function tally(list: Target[], now = new Date()): Tally {
  const shots = list.filter((t) => SHOTS.has(t.status)).sort((a, b) => (a.shotAt ?? '').localeCompare(b.shotAt ?? ''))
  const days = new Set(shots.flatMap((t) => (t.shotAt ? [day(t.shotAt)] : [])))
  let k = day(now)
  if (!days.has(k)) k = plusDay(k, -1) // ponytail: no shot yet today keeps yesterday's streak alive
  let streak = 0
  for (; days.has(k); k = plusDay(k, -1)) streak++
  let best = 0
  for (const d of days) if (!days.has(plusDay(d, -1))) {
    let run = 1
    while (days.has(plusDay(d, run))) run++
    best = Math.max(best, run)
  }
  const xp = list.reduce((sum, t) => sum + xpOf(t), 0)
  const s: Stats = {
    shots, streak, best, xp, level: levelOf(xp),
    replies: list.filter((t) => REPLIES.has(t.status)).length,
    wins: list.filter((t) => t.status === 'won').length,
    lessons: list.filter((t) => t.lesson?.trim()).length,
    picked: list.filter((t) => steps(t)[0]).length,
    quadrant: list.some((t) => ROUTES.every(([r]) => t[r])),
  }
  return { ...s, unlocked: new Set(ACHIEVEMENTS.filter((a) => a.test(s)).map((a) => a.id)) }
}

export const diff = (a: Tally, b: Tally) => ({
  gain: b.xp - a.xp,
  levelUp: b.level.n > a.level.n,
  unlocked: ACHIEVEMENTS.filter((x) => b.unlocked.has(x.id) && !a.unlocked.has(x.id)),
})

export const chance = (n: number, p: number) => Math.round((1 - (1 - p) ** n) * 100)

export function load(raw: unknown): Target[] {
  if (!Array.isArray(raw) || raw.some((t) => typeof t !== 'object' || !t || typeof t.name !== 'string'))
    throw Error('expected an array of targets')
  return raw.map((t) => ({
    ...t,
    id: typeof t.id === 'string' ? t.id : crypto.randomUUID(),
    status: STATUSES.includes(t.status) ? t.status : 'idea',
    created: t.created ?? new Date().toISOString(),
  }))
}
