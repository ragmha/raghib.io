import * as k from '../../scripts/vendor/anatomy/iso-kit.mjs'

const WIDTH = 1200
const HEIGHT = 650
const TABLE = { x: -220, y: -140, w: 440, d: 280, r: 8 }
const TOP = 48

function buildScene() {
  const bounds = [
    ...k.boxCorners(TABLE, -48, TOP + 14),
    ...k.boxCorners({ x: -92, y: -50, w: 102, d: 100 }, TOP + 14, TOP + 58),
    ...k.boxCorners({ x: 104, y: -100, w: 82, d: 42 }, TOP + 14, TOP + 35),
  ]
  const P = k.fitProjection(bounds, WIDTH, HEIGHT, {
    pad: 38,
    azimuth: 43,
    elevation: 32,
  })
  const at = point => k.iso(point, P)
  const solids = []
  const rules = []
  const addSolid = (shape, options) => solids.push(k.solidSvg(shape, options))
  const addSlab = (plan, z, h, tone = 'mid', options = {}) =>
    addSolid(k.slabOf(plan, z, h, P, 6, 0.7), { tone, ...options })
  const addCylinder = (x, y, radius, z, h, tone = 'mid', options = {}) =>
    addSolid(k.cylinder(x, y, radius, z, h, P, 32, 0.4), { tone, ...options })
  const addRule = (path, tone = 'lo') => rules.push(k.lineSvg(path, { tone }))
  const addPlanOutline = (plan, z, tone = 'lo') =>
    addRule(k.planOutline(k.insetPlan(plan, 3), z, P), tone)
  const addFasteners = (plan, z) => {
    const corners = k.corners(plan, 4)
    addRule(corners.map(([x, y]) => k.ring(x, y, 1.4, z, P, 14)).join(''), 'mid')
    solids.push(k.dotsSvg(corners.map(([x, y]) => at([x, y, z])), { size: 0.65, tone: 'hi' }))
  }
  const plate = (plan, z, h, tone = 'mid') => {
    addSlab(plan, z, h, tone)
    addPlanOutline(plan, z + h)
    addFasteners(plan, z + h)
  }
  const tray = (plan, z, tone = 'mid') => {
    const wall = 4
    const lip = 9
    addSlab(plan, z, 3, tone)
    addSlab({ x: plan.x, y: plan.y, w: plan.w, d: wall, r: 1 }, z + 3, lip)
    addSlab({ x: plan.x, y: plan.y + plan.d - wall, w: plan.w, d: wall, r: 1 }, z + 3, lip)
    addSlab({ x: plan.x, y: plan.y + wall, w: wall, d: plan.d - wall * 2, r: 1 }, z + 3, lip)
    addSlab({ x: plan.x + plan.w - wall, y: plan.y + wall, w: wall, d: plan.d - wall * 2, r: 1 }, z + 3, lip)
    addPlanOutline(plan, z + 3)
  }
  const text = (x, y, z, value, { size = 5, tone = 'hi', anchor = 'middle' } = {}) =>
    k.faceTextSvg(k.topMatrix([x, y], z, P), value, { size, tone, anchor })
  const label = (x, y, value, width = 120) => {
    const height = 31
    return `<g class="decision-hero-label" transform="translate(${x - width / 2} ${y - height / 2})"><rect width="${width}" height="${height}" rx="3"/><text x="${width / 2}" y="21" text-anchor="middle">${value}</text></g>`
  }
  const flow = (points, tone = 'mid') => {
    const projected = points.map(at)
    const [x, y] = projected.at(-1)
    const [px, py] = projected.at(-2)
    const angle = Math.atan2(y - py, x - px)
    const length = 9
    const wing = 4
    const left = [x - length * Math.cos(angle) + wing * Math.sin(angle), y - length * Math.sin(angle) - wing * Math.cos(angle)]
    const right = [x - length * Math.cos(angle) - wing * Math.sin(angle), y - length * Math.sin(angle) + wing * Math.cos(angle)]
    const path = k.pathOf(projected)
    return k.lineSvg(path, { tone, flow: true }) +
      `<path class="decision-hero-arrow" data-tone="${tone}" d="M${left[0]} ${left[1]} L${x} ${y} L${right[0]} ${right[1]}"/>`
  }

  // Workbench, reinforcing rails, legs, feet, fasteners and a graduated front edge.
  const feet = k.corners(TABLE, 18)
  for (const [x, y] of feet) {
    addCylinder(x, y, 8, -48, 5, 'lo')
    addSlab({ x: x - 4, y: y - 4, w: 8, d: 8, r: 1 }, -43, 91, 'mid')
  }
  for (const y of [-102, 102]) {
    addSlab({ x: -184, y, w: 368, d: 8, r: 1 }, -20, 9, 'lo')
  }
  plate(TABLE, TOP, 14, 'lo')
  const scale = k.topTicks(-195, 195, 5, 5, TABLE.y + TABLE.d - 14, TOP + 0.8, [3, 5], P)
  addRule(scale.minor, 'lo')
  addRule(scale.major, 'mid')

  // Inputs arrive as evidence cards in an open tray.
  const inputTray = { x: -194, y: -44, w: 76, d: 88, r: 3 }
  tray(inputTray, TOP + 14)
  for (let i = 0; i < 4; i++) {
    const z = TOP + 18 + i * 1.8
    addSlab({ x: -186, y: -35, w: 59, d: 69, r: 1 }, z, 1.2, i === 3 ? 'hi' : 'mid')
    for (let row = 0; row < 3; row++) {
      addRule(k.lineOnTop([-180, -27 + row * 7], [-135 - (row % 2) * 9, -27 + row * 7], z + 1.2, P), 'lo')
    }
  }
  addCylinder(-185, -35, 2.4, TOP + 27, 2, 'hi')

  // A compact decision unit presents a probability, not generated prose.
  const decisionBase = { x: -94, y: -52, w: 110, d: 104, r: 5 }
  plate(decisionBase, TOP + 14, 6)
  addSlab({ x: -88, y: -46, w: 98, d: 92, r: 4 }, TOP + 20, 37, 'mid')
  addPlanOutline({ x: -82, y: -40, w: 86, d: 80, r: 2 }, TOP + 57, 'faint')
  const display = { x: -76, y: -30, w: 74, d: 28, r: 2 }
  addSlab(display, TOP + 57, 2, 'lo', { flat: true })
  addRule(k.planOutline(k.insetPlan(display, 2), TOP + 59, P), 'mid')
  solids.push(text(-39, -16, TOP + 59, 'p = 0.93', { size: 9 }))
  solids.push(text(-39, -6, TOP + 59, 'CONFIDENCE', { size: 4, tone: 'mid' }))
  addCylinder(-40, 20, 12, TOP + 57, 5, 'hi')
  addRule(k.knurl(-40, 20, 12, TOP + 58, TOP + 62, 36, P), 'mid')
  addCylinder(-40, 20, 2.2, TOP + 62, 1, 'red')
  addCylinder(-12, 20, 2.3, TOP + 57, 3, 'green')
  addCylinder(0, 20, 2.3, TOP + 57, 3, 'mid')
  addCylinder(-84, -39, 1.8, TOP + 57, 2, 'lo')
  addCylinder(0, -39, 1.8, TOP + 57, 2, 'lo')

  // The orange switch represents the policy check that routes a decision.
  const switchBase = { x: 35, y: -15, w: 36, d: 30, r: 3 }
  plate(switchBase, TOP + 14, 4, 'mid')
  addSlab({ x: 39, y: -11, w: 28, d: 22, r: 2 }, TOP + 18, 8, 'hi', { className: 'decision-switch' })
  for (const [x, y] of [[43, -7], [63, -7], [43, 7], [63, 7]]) {
    addCylinder(x, y, 1.1, TOP + 26, 1.1, 'hi')
  }
  solids.push(text(53, 0, TOP + 26, 'IF', { size: 5, tone: 'hi' }))

  // Three separate output trays make the conditional paths literal.
  const routes = [
    { y: -88, label: 'GENERATE', threshold: 'p >= 0.90', tone: 'green' },
    { y: -3, label: 'REVIEW', threshold: '0.60-0.90', tone: 'mid' },
    { y: 82, label: 'STOP', threshold: 'p < 0.60', tone: 'red' },
  ]
  for (const route of routes) {
    const path = { x: 108, y: route.y - 18, w: 82, d: 44, r: 3 }
    tray(path, TOP + 14, route.tone)
    const contents = route.label === 'GENERATE'
      ? { x: 122, y: route.y - 10, w: 55, d: 26, r: 2 }
      : route.label === 'REVIEW'
        ? { x: 125, y: route.y - 9, w: 48, d: 24, r: 2 }
        : { x: 131, y: route.y - 8, w: 42, d: 22, r: 2 }
    addSlab(contents, TOP + 17, 2, route.tone === 'mid' ? 'hi' : route.tone)
    if (route.label === 'GENERATE') {
      addSlab({ x: 129, y: route.y - 5, w: 40, d: 18, r: 1 }, TOP + 19, 3, 'hi')
      for (const z of [TOP + 20, TOP + 21, TOP + 22]) {
        addRule(k.lineOnTop([134, route.y], [163, route.y], z, P), 'mid')
      }
    } else if (route.label === 'REVIEW') {
      addCylinder(148, route.y, 7, TOP + 19, 4, 'hi')
      addRule(k.ring(148, route.y, 4, TOP + 23, P, 20), 'mid')
    } else {
      addCylinder(152, route.y, 7, TOP + 19, 3, 'red')
      addRule(k.lineOnTop([147, route.y - 5], [157, route.y + 5], TOP + 22, P), 'hi')
      addRule(k.lineOnTop([147, route.y + 5], [157, route.y - 5], TOP + 22, P), 'hi')
    }
    const [labelX, labelY, labelWidth] = {
      GENERATE: [1000, 238, 204],
      REVIEW: [875, 390, 184],
      STOP: [750, 515, 152],
    }[route.label]
    solids.push(label(labelX, labelY, `${route.threshold}  ${route.label}`, labelWidth))
  }

  // Evidence flows in; the small model scores it; the IF sends it to one path.
  solids.push(flow([[-116, 0, TOP + 26], [-95, 0, TOP + 26]], 'mid'))
  solids.push(flow([[16, 0, TOP + 32], [35, 0, TOP + 32]], 'mid'))
  for (const route of routes) {
    const endY = route.y
    solids.push(flow(
      [[71, 0, TOP + 30], [87, 0, TOP + 30], [96, endY, TOP + 30], [108, endY, TOP + 24]],
      route.tone,
    ))
  }
  // The final model-generated artifact leaves the high-confidence tray.
  const output = { x: 183, y: -107, w: 20, d: 18, r: 2 }
  tray(output, TOP + 14, 'green')
  addSlab({ x: 187, y: -104, w: 12, d: 12, r: 1 }, TOP + 17, 2, 'hi')

  // All labels are attached visually to the relevant part; the prose key below
  // explains the flow without relying on color or on interaction.
  solids.push(label(430, 72, 'REQUEST + EVIDENCE', 204))
  solids.push(label(680, 72, 'SMALL DECISION MODEL', 224))
  solids.push(label(770, 280, 'IF / THEN', 112))
  solids.push(label(1080, 168, 'LARGE MODEL', 132))

  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: 'An isometric AI workbench. A request and its evidence enter a small decision model. An illustrative confidence threshold sends high-confidence work to a large model for generation, uncertain work to human review and low-confidence work to stop.',
    className: 'decision-hero-svg',
    body: [...solids, ...rules],
  })
}

export const decisionHeroSvg = buildScene()
