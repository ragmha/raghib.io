import * as k from '../../scripts/vendor/anatomy/iso-kit.mjs'

const WIDTH = 1500
const HEIGHT = 740
const DECK = 16

function buildScene() {
  const chassis = { x: -280, y: -168, w: 560, d: 336, r: 10 }
  const P = k.fitProjection([
    ...k.boxCorners(chassis, -22, 24),
    ...k.boxCorners({ x: -106, y: -58, w: 110, d: 116 }, 24, 120),
    ...k.boxCorners({ x: 124, y: -138, w: 112, d: 70 }, 24, 104),
  ], WIDTH, HEIGHT, { pad: 64, headroom: 24, azimuth: 55, elevation: 32 })
  const at = point => k.iso(point, P)
  const body = []
  const annotations = []
  const line = (path, tone = 'lo', options = {}) =>
    body.push(k.lineSvg(path, { tone, ...options }))
  const slab = (plan, z, height, tone = 'mid', options = {}) =>
    body.push(k.solidSvg(k.slabOf(plan, z, height, P, 6, .8), { tone, ...options }))
  const cylinder = (x, y, radius, z, height, tone = 'mid', options = {}) =>
    body.push(k.solidSvg(k.cylinder(x, y, radius, z, height, P, 12, .5), { tone, ...options }))
  const rule = (from, to, z, tone = 'lo') => line(k.lineOnTop(from, to, z, P), tone)
  const outline = (plan, z, tone = 'lo') => line(k.planOutline(plan, z, P), tone)
  const text = (x, y, z, value, size = 5, tone = 'mid') =>
    body.push(k.faceTextSvg(k.topMatrix([x, y], z, P), value, { size, tone, anchor: 'middle' }))
  const screws = (plan, z) => {
    for (const [x, y] of k.corners(plan, 5)) {
      cylinder(x, y, 1.5, z, .7, 'mid')
      rule([x - .7, y], [x + .7, y], z + .7, 'hi')
    }
  }
  const plate = (plan, z, height, tone = 'mid', options = {}) => {
    slab(plan, z, height, tone, options)
    outline(k.insetPlan(plan, 2.5), z + height, 'faint')
    screws(plan, z + height)
  }
  const escapeXmlText = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const label = (point, value, { dx = 0, dy = 0, tone = 'mid' } = {}) => {
    const [x, y] = at(point)
    const end = [x + dx, y + dy]
    annotations.push(`<g class="decision-hero-annotation">${k.lineSvg(k.pathOf([[x, y], [x, end[1]], end]), { tone: 'lo' })}<g class="decision-hero-label" data-tone="${tone}" transform="translate(${end[0]} ${end[1] - 10})"><text text-anchor="middle">${escapeXmlText(value)}</text></g></g>`)
  }
  const rail = (points, tone = 'mid', active = false) => {
    const projected = points.map(at)
    const path = k.pathOf(projected)
    line(path, 'faint', { className: 'decision-track-bed' })
    line(path, tone, { className: 'decision-track' })
    if (active) line(path, tone, { flow: true, className: 'decision-signal' })
    const [x, y] = projected.at(-1)
    body.push(`<circle class="decision-port" data-tone="${tone}" cx="${x}" cy="${y}" r="3"/>`)
  }

  // One grounded chassis: isolating feet, milled edge, circuit channels and mounts.
  for (const [x, y] of k.corners(chassis, 24)) {
    cylinder(x, y, 9, -22, 7, 'lo')
    cylinder(x, y, 6, -15, 7, 'mid')
  }
  plate(chassis, -8, 14, 'lo')
  plate(k.insetPlan(chassis, 5), 6, 10, 'mid')
  const frontScale = k.topTicks(-250, 250, 5, 5, 150, DECK + .5, [2, 5], P)
  line(frontScale.minor, 'faint')
  line(frontScale.major, 'lo')
  for (const y of [-146, 144]) {
    rule([-250, y], [250, y], DECK + .5, 'faint')
  }
  for (let row = 0; row < 5; row++) {
    rule([-252, 84 + row * 8], [-170 + row * 7, 84 + row * 8], DECK + 1, 'faint')
    cylinder(-170 + row * 7, 84 + row * 8, 1.2, DECK + 1, .5, 'lo')
  }
  text(-210, 124, DECK + 1, 'EVIDENCE IN', 5)
  text(72, 146, DECK + 1, 'POLICY / THRESHOLDS / AUDIT', 5, 'lo')

  rail([[-166, -5, DECK + 2], [-128, -5, DECK + 2], [-112, 0, DECK + 2]], 'blue', true)
  rail([[8, 0, DECK + 2], [45, 0, DECK + 2]], 'green', true)
  rail([[77, -7, DECK + 2], [98, -7, DECK + 2], [98, -102, DECK + 2], [126, -102, DECK + 2]], 'green', true)
  rail([[77, 0, DECK + 2], [116, 0, DECK + 2], [144, 10, DECK + 2]], 'mid')
  rail([[77, 7, DECK + 2], [98, 7, DECK + 2], [98, 106, DECK + 2], [144, 106, DECK + 2]], 'red')

  // The evidence feeder has guides, rollers and a stack of source documents.
  const feeder = { x: -249, y: -51, w: 83, d: 104, r: 4 }
  plate(feeder, DECK, 9)
  for (const y of [-47, 45]) {
    slab({ x: -246, y, w: 76, d: 5, r: 1 }, DECK + 9, 11)
  }
  for (let i = 0; i < 5; i++) {
    const z = DECK + 10 + i * 2
    slab({ x: -238 + i * 1.6, y: -36, w: 58, d: 72, r: 1 }, z, 1, i === 4 ? 'hi' : 'lo')
  }
  for (let row = 0; row < 7; row++) {
    rule([-226, -27 + row * 8], [-192 - row % 3 * 5, -27 + row * 8], DECK + 19, 'mid')
  }
  for (const y of [-34, 34]) {
    cylinder(-171, y, 3, DECK + 9, 7, 'blue')
    line(k.knurl(-171, y, 3, DECK + 10, DECK + 16, 12, P), 'lo')
  }

  // The small model is a precision probability instrument, not a text terminal.
  const core = { x: -110, y: -62, w: 118, d: 124, r: 7 }
  plate(core, DECK, 7, 'hi')
  for (const [x, y] of k.corners(core, 12)) {
    cylinder(x, y, 3, DECK + 7, 34, 'mid')
  }
  plate({ x: -106, y: -58, w: 110, d: 116, r: 5 }, DECK + 13, 25, 'mid')
  for (let i = 0; i < 9; i++) {
    slab({ x: -101, y: -48 + i * 11, w: 8, d: 5, r: 1 }, DECK + 38, 8, 'lo')
  }
  plate({ x: -91, y: -49, w: 90, d: 98, r: 4 }, DECK + 38, 5, 'hi', { lit: true })
  cylinder(-46, 0, 35, DECK + 43, 8, 'hi')
  line(k.knurl(-46, 0, 35, DECK + 44, DECK + 50, 64, P), 'mid')
  cylinder(-46, 0, 30, DECK + 51, 3, 'green', { className: 'decision-dial' })
  const ticks = k.radialTicks(-46, 0, 27, 50, 5, DECK + 54, [2, 4], P)
  line(ticks.minor, 'lo')
  line(ticks.major, 'hi')
  cylinder(-46, 0, 19, DECK + 54, 2, 'mid')
  text(-46, -1, DECK + 56.5, '0.93', 12, 'hi')
  text(-46, 9, DECK + 56.5, 'CONFIDENCE', 3.2)
  const angle = -Math.PI / 2 + .93 * Math.PI * 2
  rule(
    [-46 + 22 * Math.cos(angle), 22 * Math.sin(angle)],
    [-46 + 28 * Math.cos(angle), 28 * Math.sin(angle)],
    DECK + 55,
    'green',
  )
  for (let i = 0; i < 5; i++) {
    cylinder(-77 + i * 14, 39, 1.5, DECK + 43, 1, i < 4 ? 'green' : 'lo')
  }

  // A three-contact selector makes the if-statement a physical routing mechanism.
  const selector = { x: 43, y: -23, w: 36, d: 46, r: 3 }
  plate(selector, DECK, 5)
  for (const y of [-14, 0, 14]) {
    slab({ x: 66, y: y - 3, w: 7, d: 6, r: 1 }, DECK + 5, 3, y === -14 ? 'green' : 'lo')
  }
  cylinder(55, 0, 4, DECK + 5, 5, 'hi')
  line(k.pathOf([at([55, 0, DECK + 11]), at([69, -14, DECK + 11])]), 'green', { className: 'decision-contact' })
  cylinder(69, -14, 2, DECK + 8, 2, 'green')
  text(55, 14, DECK + 5.5, 'IF', 4, 'hi')

  // Only the accepted rail powers the large model's compute bank.
  const compute = { x: 126, y: -140, w: 112, d: 76, r: 5 }
  plate(compute, DECK, 8, 'green')
  for (let blade = 0; blade < 5; blade++) {
    const z = DECK + 9 + blade * 11
    plate({ x: 132, y: -134, w: 100, d: 64, r: 2 }, z, 7, blade === 4 ? 'hi' : 'mid', { lit: blade === 4 })
    for (let slot = 0; slot < 8; slot++) {
      rule([139 + slot * 11, -74], [144 + slot * 11, -74], z + 7, 'lo')
    }
    for (let led = 0; led < 3; led++) {
      cylinder(221 - led * 5, -77, .9, z + 7, .7, 'green')
    }
  }
  for (const x of [157, 203]) {
    cylinder(x, -104, 17, DECK + 60, 2, 'mid')
    for (const radius of [6, 11, 15]) line(k.ring(x, -104, radius, DECK + 62, P), 'lo')
    const grille = k.radialTicks(x, -104, 15, 16, 1, DECK + 62, [9, 9], P)
    line(grille.major, 'mid')
    cylinder(x, -104, 4, DECK + 62, 1, 'hi')
  }
  text(182, -128, DECK + 60, 'GENERATION', 4.5, 'hi')

  // Review is an inspection window; stop is a closed physical shutter.
  const review = { x: 144, y: -18, w: 87, d: 57, r: 4 }
  plate(review, DECK, 6)
  slab(k.insetPlan(review, 8), DECK + 6, 5, 'hi')
  for (let row = 0; row < 4; row++) {
    rule([160, -4 + row * 7], [205 - row % 2 * 14, -4 + row * 7], DECK + 11, 'mid')
  }
  cylinder(208, 14, 10, DECK + 11, 3, 'hi')
  line(k.ring(208, 14, 7, DECK + 14, P), 'mid')
  rule([215, 21], [224, 30], DECK + 13, 'hi')
  const stop = { x: 144, y: 77, w: 87, d: 59, r: 4 }
  plate(stop, DECK, 6, 'red')
  for (let slat = 0; slat < 7; slat++) {
    slab({ x: 152, y: 84 + slat * 6, w: 71, d: 5, r: 1 }, DECK + 6, 4, 'lo')
  }
  cylinder(187, 105, 12, DECK + 10, 3, 'red')
  rule([182, 100], [192, 110], DECK + 13, 'red')
  rule([182, 110], [192, 100], DECK + 13, 'red')

  label([-230, -38, 45], 'REQUEST + EVIDENCE', { dy: -66, dx: -20 })
  label([-46, 0, 77], 'SMALL DECISION MODEL', { dy: -90 })
  label([57, 0, 30], 'IF / THEN', { dy: -50, dx: 16 })
  label([185, -103, 82], 'LARGE MODEL', { dy: -80, dx: 48, tone: 'green' })
  label([230, -103, 27], 'p >= 0.90  GENERATE', { dx: 98, dy: 12, tone: 'green' })
  label([230, 12, 27], '0.60-0.90  REVIEW', { dx: 98, dy: 32 })
  label([230, 107, 27], 'p < 0.60  STOP', { dx: 76, dy: 54, tone: 'red' })

  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: 'An isometric AI workbench reimagined as a precision decision engine. Evidence enters a small probability instrument. Its illustrative confidence of 0.93 closes a selector that powers the large model. Other tracks lead to human review or a closed stop shutter.',
    className: 'decision-hero-svg',
    body: [...body, ...annotations],
  })
}

export const decisionHeroSvg = buildScene()
