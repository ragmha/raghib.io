import * as k from '../../scripts/vendor/anatomy/iso-kit.mjs'

const WIDTH = 1200
const HEIGHT = 620
const TOP = 34
const DECK = { x: -260, y: -160, w: 520, d: 320, r: 12 }
const OUTPUTS = [
  { name: 'SUPPORTED', tone: 'green', x: 112, y: -116 },
  { name: 'CONTRADICTED', tone: 'red', x: 112, y: -12 },
  { name: 'STALE', tone: 'blue', x: 112, y: 92 },
  { name: 'UNKNOWN', tone: 'mid', x: 112, y: 196 },
]

function buildScene() {
  const claim = { x: -228, y: -56, w: 96, d: 104, r: 4 }
  const testBase = { x: -68, y: -80, w: 128, d: 152, r: 7 }
  const bounds = [
    ...k.boxCorners(DECK, 0, TOP + 8),
    ...k.boxCorners(claim, TOP + 8, TOP + 13),
    ...k.boxCorners(testBase, TOP + 8, TOP + 57),
    ...OUTPUTS.flatMap(({ x, y }) => k.boxCorners({ x, y, w: 88, d: 88, r: 4 }, TOP + 8, TOP + 13)),
  ]
  const P = k.fitProjection(bounds, WIDTH, HEIGHT, { pad: 38, azimuth: 43, elevation: 32 })
  const solids = []
  const lines = []
  const addSolid = (shape, options) => solids.push(k.solidSvg(shape, options))
  const addSlab = (plan, z, h, tone = 'mid', options = {}) =>
    addSolid(k.slabOf(plan, z, h, P, 6, 0.6), { tone, ...options })
  const addLine = (path, tone = 'lo') => lines.push(k.lineSvg(path, { tone }))
  const at = point => k.iso(point, P)
  const screenLabel = (x, y, text, width, tone = 'mid') =>
    `<g class="decision-hero-label rfp-sandbox-label" data-tone="${tone}" transform="translate(${x - width / 2} ${y - 15})"><rect width="${width}" height="30" rx="3"/><text x="${width / 2}" y="20" text-anchor="middle">${text}</text></g>`
  const arrow = (points, tone = 'mid') => {
    const projected = points.map(at)
    const [x, y] = projected.at(-1)
    const [px, py] = projected.at(-2)
    const angle = Math.atan2(y - py, x - px)
    const left = [x - 8 * Math.cos(angle) + 4 * Math.sin(angle), y - 8 * Math.sin(angle) - 4 * Math.cos(angle)]
    const right = [x - 8 * Math.cos(angle) - 4 * Math.sin(angle), y - 8 * Math.sin(angle) + 4 * Math.cos(angle)]
    lines.push(k.lineSvg(k.pathOf(projected), { tone, flow: true, className: 'rfp-sandbox-flow' }))
    lines.push(`<path class="decision-hero-arrow" data-tone="${tone}" d="M${left[0]} ${left[1]} L${x} ${y} L${right[0]} ${right[1]}"/>`)
  }

  addSlab(DECK, 0, TOP, 'lo')
  addLine(k.planOutline(k.insetPlan(DECK, 5), TOP, P), 'mid')

  addSlab(claim, TOP + 8, 5, 'hi')
  for (let index = 0; index < 4; index++) {
    const y = claim.y + 19 + index * 17
    addLine(k.lineOnTop([claim.x + 12, y], [claim.x + 76 - (index % 2) * 12, y], TOP + 13, P), 'mid')
  }

  addSlab(testBase, TOP + 8, 6, 'mid')
  addSlab({ x: -56, y: -68, w: 104, d: 128, r: 4 }, TOP + 14, 43, 'lo')
  addSlab({ x: -44, y: -56, w: 80, d: 34, r: 2 }, TOP + 57, 2, 'hi', { flat: true })
  addLine(k.planOutline({ x: -42, y: -54, w: 76, d: 30, r: 1 }, TOP + 59, P), 'mid')
  for (const [x, y, tone] of [[-30, 4, 'green'], [-8, 4, 'red'], [14, 4, 'blue']]) {
    addSolid(k.cylinder(x, y, 4, TOP + 57, 3, P, 24, 0.3), { tone })
  }
  addLine(k.planOutline({ x: -44, y: 18, w: 80, d: 38, r: 3 }, TOP + 57, P), 'faint')
  for (let index = 0; index < 3; index++) {
    addLine(k.lineOnTop([-36, 26 + index * 9], [26, 26 + index * 9], TOP + 57, P), 'lo')
  }

  for (const { x, y, tone } of OUTPUTS) {
    const card = { x, y, w: 88, d: 88, r: 4 }
    addSlab(card, TOP + 8, 5, tone)
    for (let index = 0; index < 3; index++) {
      const row = y + 27 + index * 15
      addLine(k.lineOnTop([x + 14, row], [x + 74 - (index === 1 ? 14 : 0), row], TOP + 13, P), 'lo')
    }
  }

  const claimStart = [-132, -4, TOP + 16]
  const checkStart = [-68, -4, TOP + 31]
  arrow([claimStart, [-98, -4, TOP + 20], checkStart])
  for (const { x, y, tone } of OUTPUTS) {
    arrow([[60, -4, TOP + 31], [88, -4, TOP + 31], [100, y + 44, TOP + 31], [x, y + 44, TOP + 16]], tone)
  }

  const labels = [
    screenLabel(...at([-180, -56, TOP + 20]), 'APPROVED CLAIM', 188),
    screenLabel(...at([-4, -80, TOP + 67]), 'CHECK + EVIDENCE', 202),
    ...OUTPUTS.map(({ x, y, name, tone }) =>
      screenLabel(...at([x + 44, y + 44, TOP + 22]), name, name === 'CONTRADICTED' ? 170 : 140, tone)),
  ]

  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: 'An isometric evaluation bench. An approved vendor claim enters a sandbox check with evidence. The check returns one of four outcomes: supported, contradicted, stale, or unknown.',
    className: 'rfp-sandbox-hero-svg',
    body: [...solids, ...lines, ...labels],
  })
}

export const rfpSandboxHeroSvg = buildScene()
