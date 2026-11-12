import * as k from '../../scripts/vendor/anatomy/iso-kit.mjs'

// Every article gets its own invented machine; the object's working is the explanation.
const WIDTH = 1500
const HEIGHT = 740
const B = 14

const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const depth = ([x, y]) => x * 0.57 + y * 0.82

const CAMERA = { azimuth: 55, elevation: 32 }

function workshop(P) {
  const body = []
  const notes = []
  const at = point => k.iso(point, P)
  const line = (d, tone = 'lo', o = {}) => body.push(k.lineSvg(d, { tone, ...o }))
  const solid = (paths, tone, o) => body.push(k.solidSvg(paths, { tone, ...o }))
  const box = (x, y, w, d, z, h, tone = 'mid', o = {}) => solid(k.slabOf({ x, y, w, d, r: o.r ?? 1.5 }, z, h, P, 6, 0.5), tone, o)
  const cyl = (x, y, r, z, h, tone = 'mid', o = {}) => solid(k.cylinder(x, y, r, z, h, P, o.steps ?? 28, 0.4), tone, o)
  const bar = ([ax, ay], [bx, by], width, z, h, tone = 'mid', o = {}) => {
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = (-(by - ay) / len) * width / 2
    const ny = ((bx - ax) / len) * width / 2
    solid(k.extrude([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], z, h, P), tone, o)
  }
  const rule = (a, b, z, tone = 'lo') => line(k.lineOnTop(a, b, z, P), tone)
  const seg = (a, b, tone = 'lo', o = {}) => line(k.segment(a, b, P), tone, o)
  const ring = (x, y, r, z, tone = 'lo') => line(k.ring(x, y, r, z, P), tone)
  const outline = (x, y, w, d, z, tone = 'faint') => line(k.planOutline({ x, y, w, d, r: 1 }, z, P), tone)
  const text = (x, y, z, value, size = 6, tone = 'mid') => body.push(k.faceTextSvg(k.topMatrix([x, y], z, P), value, { size, tone, anchor: 'middle' }))
  const screws = (x, y, w, d, z) => {
    for (const [sx, sy] of k.corners({ x, y, w, d }, 5)) {
      cyl(sx, sy, 1.6, z, 0.7, 'mid', { steps: 12 })
      rule([sx - 0.8, sy], [sx + 0.8, sy], z + 0.7, 'hi')
    }
  }
  const plate = (x, y, w, d, z, h, tone = 'mid', o = {}) => {
    box(x, y, w, d, z, h, tone, o)
    outline(x + 2.5, y + 2.5, w - 5, d - 5, z + h)
    if (w > 24 && d > 24) screws(x, y, w, d, z + h)
  }
  const base = (x, y, w, d) => {
    for (const [fx, fy] of k.corners({ x, y, w, d }, 24)) {
      cyl(fx, fy, 9, -12, 6, 'lo')
      cyl(fx, fy, 6, -6, 6, 'mid')
    }
    plate(x, y, w, d, 0, 8, 'lo')
    plate(x + 5, y + 5, w - 10, d - 10, 8, B - 8, 'mid')
  }
  // Open-topped container: floor and far walls, contents, then near walls.
  const tray = (x, y, w, d, z, h, inside = () => {}, tone = 'mid', wall = 3) => {
    box(x, y, w, d, z, wall, tone)
    box(x, y, w, wall, z + wall, h - wall, tone)
    box(x, y + wall, wall, d - wall, z + wall, h - wall, tone)
    inside()
    box(x + wall, y + d - wall, w - wall * 2, wall, z + wall, h - wall, tone)
    box(x + w - wall, y + wall, wall, d - wall, z + wall, h - wall, tone)
  }
  const dial = (x, y, r, z, angle, tone = 'hi') => {
    cyl(x, y, r, z, 3, tone)
    const ticks = k.radialTicks(x, y, r - 2, 24, 4, z + 3, [2, 5], P, -2.2, 4.4)
    line(ticks.minor, 'faint')
    line(ticks.major, 'mid')
    bar([x, y], [x + Math.sin(angle) * (r - 6), y - Math.cos(angle) * (r - 6)], 1.6, z + 3, 1, 'hi')
    cyl(x, y, 2.4, z + 3, 1.5, 'mid', { steps: 12 })
  }
  const lamp = (point, tone, r = 5) => {
    const [x, y] = at(point)
    body.push(`<circle class="decision-port" data-tone="${tone}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`)
  }
  const rail = (points, tone = 'mid', active = true) => {
    const projected = points.map(at)
    const path = k.pathOf(projected)
    line(path, 'faint', { className: 'decision-track-bed' })
    line(path, tone, { className: 'decision-track' })
    if (active) line(path, tone, { flow: true, className: 'decision-signal' })
    const [x, y] = projected.at(-1)
    body.push(`<circle class="decision-port" data-tone="${tone}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`)
  }
  const labels = []
  const label = (point, value, { dx = 0, dy = -60, tone = 'mid' } = {}) => {
    const [x, y] = at(point)
    const end = [x + dx, y + dy]
    const side = dy === 0 || Math.abs(dx) > Math.abs(dy)
    const anchor = side ? (dx < 0 ? 'end' : 'start') : 'middle'
    const [tx, ty] = side ? [end[0] + (dx < 0 ? -8 : 8), end[1] + 5] : [end[0], end[1] + (dy > 0 ? 18 : -8)]
    const path = side ? k.pathOf([[x, y], [x, end[1]], end]) : k.pathOf([[x, y], end])
    // Labels keep their pixel size at any scale; 14px JetBrains Mono with .05em tracking is about 9.1px a character.
    const width = value.length * 9.1
    const left = tx - width * { start: 0, middle: 0.5, end: 1 }[anchor]
    labels.push({ point: [x, y], box: [Math.min(left, end[0], x) - x, Math.min(ty - 11, end[1], y) - y, Math.max(left + width, end[0], x) - x, Math.max(ty + 4, end[1], y) - y] })
    notes.push(`<g class="decision-hero-annotation">${k.lineSvg(path, { tone: 'lo' })}<g class="decision-hero-label" data-tone="${tone}" transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})"><text text-anchor="${anchor}">${escapeXml(value)}</text></g></g>`)
  }
  const svg = aria => k.figureSvg({ width: WIDTH, height: HEIGHT, label: aria, className: 'decision-hero-svg flow-hero-svg', body: [...body, ...notes] })
  const extent = () => {
    const xs = []
    const ys = []
    for (const [, mx, my, cx, cy] of body.join('').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)|cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)) {
      xs.push(+(mx ?? cx))
      ys.push(+(my ?? cy))
    }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  }
  return { P, at, extent, labels, line, box, cyl, bar, rule, seg, ring, outline, text, plate, base, tray, dial, lamp, rail, label, svg }
}

function render(aria, draw, { pad = 28, headroom = 96 } = {}) {
  const probe = workshop({ origin: [0, 0], scale: 1, ...CAMERA })
  draw(probe)
  const [left, top, right, bottom] = probe.extent()
  const bounds = scale => probe.labels.reduce(([l, t, r, b], { point: [x, y], box }) =>
    [Math.min(l, x * scale + box[0]), Math.min(t, y * scale + box[1]), Math.max(r, x * scale + box[2]), Math.max(b, y * scale + box[3])],
  [left * scale, top * scale, right * scale, bottom * scale])
  let scale = Math.min((WIDTH - pad * 2) / (right - left), (HEIGHT - pad - headroom) / (bottom - top))
  let origin = [WIDTH / 2 - ((left + right) / 2) * scale, headroom + (HEIGHT - pad - headroom) / 2 - ((top + bottom) / 2) * scale]
  let [l, t, r, b] = bounds(scale)
  // When a label nears the edge, shrink the machine until the labels fit too, then center the whole drawing.
  if (l + origin[0] < 12 || t + origin[1] < 12 || r + origin[0] > WIDTH - 12 || b + origin[1] > HEIGHT - 12) {
    while ((r - l > WIDTH - pad * 2 || b - t > HEIGHT - pad * 2) && scale > 0.05) [l, t, r, b] = bounds(scale *= 0.98)
    origin = [(WIDTH - l - r) / 2, (HEIGHT - t - b) / 2]
  }
  const machine = workshop({ origin, scale, ...CAMERA })
  draw(machine)
  return machine.svg(aria)
}

function agentHarness(t) {
  t.base(-300, -150, 600, 300)
  t.rail([[-200, 0, B + 1], [-150, 0, B + 1]])
  t.rail([[-50, 0, B + 1], [0, 0, B + 1]])
  const exits = [[-80, 'green'], [0, 'blue'], [80, 'red']]
  for (const [y, tone] of exits) t.rail([[80, 0, B + 1], [118, 0, B + 1], [150, y, B + 1], [196, y, B + 1]], tone)

  // Event journal: a paper tape spooled between two reels along the back edge.
  t.plate(-250, -138, 500, 26, B, 6, 'lo')
  t.box(-236, -131, 472, 12, B + 6, 1, 'hi', { flat: true })
  for (let x = -228; x < 230; x += 14) t.rule([x, -129], [x + (x % 28 ? 6 : 10), -129], B + 7, 'mid')
  for (const x of [-262, 262]) {
    t.cyl(x, -125, 18, B, 22, 'mid')
    t.ring(x, -125, 11, B + 22, 'faint')
    t.cyl(x, -125, 4, B + 22, 6, 'hi', { steps: 14 })
  }

  // Feeder: a stack of proposed tool-call cards between guides.
  t.plate(-282, -52, 82, 104, B, 6)
  t.box(-278, -48, 74, 5, B + 6, 12, 'lo')
  for (let i = 0; i < 6; i++) t.box(-270 + i, -36, 58, 70, B + 7 + i * 2, 1.2, i === 5 ? 'hi' : 'lo')
  for (let row = 0; row < 4; row++) t.rule([-262, -24 + row * 12], [-232 - (row % 2) * 10, -24 + row * 12], B + 19.4, 'mid')
  t.box(-278, 43, 74, 5, B + 6, 12, 'lo')

  // Registry: a key board where only registered tools have a peg.
  t.plate(-150, -62, 100, 124, B, 10)
  const pegs = [1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0]
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -126 + col * 26
      const y = -42 + row * 28
      t.ring(x, y, 7, B + 10, 'lo')
      if (pegs[row * 3 + col]) {
        t.cyl(x, y, 3.5, B + 10, 14, 'mid', { steps: 16 })
        t.cyl(x, y, 7, B + 24, 3, 'hi', { steps: 20 })
      }
    }
  }

  // Policy gate: a three-armed turnstile on a pedestal.
  t.plate(0, -42, 80, 84, B, 30, 'lo')
  t.cyl(40, 0, 9, B + 30, 34, 'mid')
  const arms = [0.5, 2.6, 4.7].map(a => [40 + Math.cos(a) * 52, Math.sin(a) * 52])
  const behind = arms.filter(p => depth(p) < depth([40, 0]))
  for (const p of behind) t.bar([40, 0], p, 6, B + 66, 5, 'mid')
  t.cyl(40, 0, 16, B + 64, 10, 'hi', { lit: true })
  t.ring(40, 0, 9, B + 74, 'mid')
  for (const p of arms.filter(p => !behind.includes(p))) t.bar([40, 0], p, 6, B + 66, 5, 'mid')

  // Run: an anvil. Approval: a bell on a hold tray. Deny: a reject bin.
  t.plate(200, -102, 60, 44, B, 10)
  t.box(194, -94, 72, 28, B + 10, 10, 'green')
  t.cyl(230, -80, 6, B + 20, 10, 'mid', { steps: 16 })
  t.plate(200, -22, 60, 44, B, 6)
  t.cyl(230, 0, 15, B + 6, 12, 'blue')
  t.cyl(230, 0, 7, B + 18, 6, 'mid', { steps: 18 })
  t.cyl(230, 0, 3, B + 24, 4, 'hi', { steps: 12 })
  t.tray(200, 56, 60, 48, B, 28, () => {
    t.box(212, 66, 30, 24, B + 3, 1.2, 'lo')
    t.box(216, 70, 26, 20, B + 4.2, 1.2, 'lo')
  }, 'red')
  for (const [y, tone] of exits) t.lamp([268, y + (y > 0 ? 30 : 18), B], tone)

  t.label([-241, 0, B + 20], 'MODEL TOOL CALL', { dy: -110 })
  t.label([-100, -30, B + 27], 'REGISTRY = ALLOWLIST', { dy: -140 })
  t.label([40, 0, B + 74], 'POLICY GATE', { dy: -96 })
  t.label([266, -80, B + 20], 'RUN TOOL', { dx: 54, dy: 0, tone: 'green' })
  t.label([245, 0, B + 18], 'AWAIT APPROVAL', { dx: 70, dy: 0, tone: 'blue' })
  t.label([260, 80, B + 28], 'DENY', { dx: 50, dy: 0, tone: 'red' })
  t.label([262, -125, B + 28], 'EVENT JOURNAL', { dy: -70 })
}

function budgetFallback(t) {
  t.base(-300, -150, 600, 300)
  t.rail([[200, 90, B + 1], [80, 130, B + 1], [-200, 130, B + 1], [-200, 64, B + 1]], 'green', false)

  // Reserve: a small tank piped only to the cheap-model nozzle.
  t.box(146, -100, 8, 54, B, 6, 'lo')
  t.box(60, -54, 94, 8, B, 6, 'lo')
  t.cyl(150, -112, 26, B, 52, 'mid')
  t.ring(150, -112, 26, B + 18, 'faint')
  t.dial(150, -112, 16, B + 52, -1.6)
  t.lamp([180, -90, B + 30], 'blue')

  // Main tank: the budget, with its gauge on empty.
  t.box(-150, -5, 150, 10, B + 6, 10, 'lo')
  t.cyl(-200, 0, 62, B, 104, 'mid')
  for (const z of [B + 28, B + 70]) t.ring(-200, 0, 62, z, 'faint')
  t.cyl(-200, 0, 46, B + 104, 4, 'lo')
  t.dial(-200, 0, 38, B + 108, -2.0)

  // Hard stop: a gate valve with a red handwheel.
  t.plate(-120, -16, 30, 32, B, 30, 'lo')
  t.cyl(-105, 0, 3, B + 30, 12, 'mid', { steps: 12 })
  t.cyl(-105, 0, 17, B + 42, 3, 'red')
  for (let s = 0; s < 3; s++) {
    const a = (s * Math.PI) / 3
    t.rule([-105 - Math.cos(a) * 14, -Math.sin(a) * 14], [-105 + Math.cos(a) * 14, Math.sin(a) * 14], B + 45, 'mid')
  }
  t.lamp([-90, 20, B + 30], 'red')

  // Model policy: a manifold with five nozzles; only one is open.
  t.plate(-40, -112, 34, 224, B, 26)
  for (let i = 0; i < 5; i++) t.text(-23, -90 + i * 45, B + 26, '0' + (i + 1), 6, 'lo')
  const nozzles = [-90, -50, 0, 45, 90]
  for (const y of nozzles) {
    t.box(-6, y - 5, 62, 10, B + 8, 10, 'lo')
    t.cyl(64, y, 10, B, 34, y === -50 ? 'blue' : 'mid')
    if (y === -50) {
      t.cyl(64, y, 6, B + 34, 12, 'hi', { lit: true, steps: 18 })
    } else {
      t.cyl(64, y, 12, B + 34, 5, 'lo')
      t.cyl(64, y, 4, B + 39, 3, 'mid', { steps: 12 })
    }
  }

  // Approved increase: a refill tank waiting on its own line.
  t.cyl(210, 90, 40, B, 70, 'mid')
  t.ring(210, 90, 40, B + 40, 'faint')
  t.cyl(210, 90, 14, B + 70, 8, 'hi')
  t.lamp([250, 112, B + 20], 'green')

  t.label([-200, -40, B + 112], 'BUDGET = HOW MUCH', { dy: -70 })
  t.label([-23, -100, B + 26], 'MODEL POLICY = WHICH MODELS', { dy: -150 })
  t.label([-105, 0, B + 45], 'HARD STOP', { dy: -150, tone: 'red' })
  t.label([150, -112, B + 55], 'ONE-TIME GRACE, CHEAP MODEL ONLY', { dy: -90, tone: 'blue' })
  t.label([240, 90, B + 70], 'APPROVED INCREASE', { dx: 40, dy: 0, tone: 'green' })
}

function dnsDelegation(t) {
  t.base(-320, -160, 640, 320)
  const track = (from, to, gauge = 9) => {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1])
    const ux = (to[0] - from[0]) / len
    const uy = (to[1] - from[1]) / len
    for (let s = 6; s < len; s += 16) {
      const cx = from[0] + ux * s
      const cy = from[1] + uy * s
      t.bar([cx + uy * 16, cy - ux * 16], [cx - uy * 16, cy + ux * 16], 5, B, 2, 'lo')
    }
    for (const side of [-gauge, gauge]) {
      t.bar([from[0] + uy * side, from[1] - ux * side], [to[0] + uy * side, to[1] - ux * side], 2.4, B + 2, 3, 'mid')
    }
  }
  track([-300, 0], [-60, 0])
  track([-60, 0], [40, -90])
  track([40, -90], [200, -90])
  track([-60, 0], [40, 90])
  track([40, 90], [200, 90])
  t.rail([[-300, 0, B + 6], [-60, 0, B + 6], [40, -90, B + 6], [196, -90, B + 6]], 'red')
  t.rail([[-60, 0, B + 6], [40, 90, B + 6], [196, 90, B + 6]], 'green', false)

  // Registrar: a ticket booth with a flag; it holds the domain.
  t.plate(-290, -150, 70, 56, B, 6, 'lo')
  t.box(-282, -144, 54, 42, B + 6, 34, 'mid')
  t.box(-286, -148, 62, 50, B + 40, 4, 'lo')
  t.cyl(-238, -128, 1.6, B + 44, 34, 'mid', { steps: 10 })
  t.box(-238, -129, 22, 1.6, B + 64, 12, 'hi')
  t.text(-255, -123, B + 44, 'REG', 6, 'mid')

  // Visitors: a carriage on the entry track.
  for (const x of [-268, -212]) t.box(x, -14, 10, 28, B + 5, 6, 'lo')
  t.box(-275, -15, 80, 30, B + 10, 26, 'mid')
  t.box(-278, -17, 86, 34, B + 36, 3, 'lo')
  for (let w = 0; w < 4; w++) t.outline(-268 + w * 18, -15, 12, 0.1, B + 30, 'faint')

  // NS delegation: the points lever. It still throws the switch to the old zone.
  t.plate(-80, -92, 44, 34, B, 16)
  for (let s = 0; s < 4; s++) t.rule([-74 + s * 10, -88], [-74 + s * 10, -64], B + 16, 'faint')
  t.bar([-58, -58], [-58, -10], 3, B + 4, 2, 'mid')
  t.cyl(-50, -75, 2.6, B + 16, 44, 'mid', { steps: 12 })
  t.cyl(-50, -75, 7, B + 60, 9, 'hi', { lit: true, steps: 20 })

  // TTL: a timer on a post; it sets how long the wrong answer is remembered.
  t.cyl(-150, 96, 9, B, 4, 'lo')
  t.cyl(-150, 96, 2.6, B + 4, 40, 'mid', { steps: 12 })
  t.dial(-150, 96, 24, B + 44, 1.1)

  const station = (y, tone, name) => {
    t.plate(208, y - 38, 96, 76, B, 8, 'lo')
    t.box(222, y - 30, 66, 46, B + 8, 40, 'mid')
    for (let w = 0; w < 3; w++) t.outline(288, y - 24 + w * 15, 0.1, 9, B + 36, 'faint')
    t.box(216, y - 36, 78, 58, B + 48, 5, 'lo')
    t.text(255, y - 7, B + 53, name, 7, 'mid')
    t.cyl(298, y + 28, 2, B + 8, 40, 'mid', { steps: 10 })
    t.box(292, y + 24, 12, 8, B + 48, 14, tone)
    t.lamp([304, y + 28, B + 56], tone)
  }
  station(-90, 'red', '404')
  station(90, 'green', 'SITE')

  t.label([-255, -125, B + 76], 'REGISTRAR', { dy: -50 })
  t.label([-235, 0, B + 40], 'VISITORS', { dy: -120 })
  t.label([-50, -75, B + 69], 'NS DELEGATION', { dy: -84 })
  t.label([-150, 96, B + 47], 'TTL = BLAST RADIUS', { dx: -50, dy: 0 })
  t.label([300, -90, B + 53], 'OLD ZONE → 404', { dx: 46, dy: 0, tone: 'red' })
  t.label([300, 90, B + 53], 'NEW ZONE → SITE', { dx: 46, dy: 0, tone: 'green' })
}

function actionTriage(t) {
  t.base(-320, -150, 640, 300)
  const presses = [-60, 60]
  for (const y of presses) t.rail([[-190, 0, B + 1], [-160, 0, B + 1], [-160, y, B + 1], [-130, y, B + 1]])
  for (const y of presses) t.rail([[-50, y, B + 1], [60, y, B + 1], [60, 0, B + 1], [96, 0, B + 1]])
  const bins = [['green', 'MY NEXT ACTIONS'], ['blue', 'MY LATER LIST'], ['red', 'NEEDS REVIEW'], ['mid', 'HANDOFFS + RECORDS']]
  bins.forEach(([tone], i) => t.rail([[96, 0, B + 1], [120, 0, B + 1], [120, -96 + i * 64, B + 1], [150, -96 + i * 64, B + 1]], tone))

  // The rubric: one card, standing behind both presses.
  t.plate(-150, -142, 110, 18, B, 6, 'lo')
  t.box(-140, -134, 90, 4, B + 6, 56, 'hi', { lit: true })
  for (let r = 0; r < 5; r++) t.seg([-132, -130, B + 52 - r * 9], [-70 + (r % 2) * 10, -130, B + 52 - r * 9], 'mid')

  // Evidence snapshot: meetings and chats in one inbox tray.
  t.tray(-282, -52, 88, 104, B, 22, () => {
    for (let i = 0; i < 7; i++) t.box(-274 + (i % 2) * 2, -42, 66, 82, B + 3 + i * 2, 1.2, i === 6 ? 'hi' : 'lo')
    for (let r = 0; r < 4; r++) t.rule([-264, -28 + r * 16], [-224 - (r % 2) * 12, -28 + r * 16], B + 16.4, 'mid')
  })

  // Two identical stamp presses: same evidence, same rubric, different models.
  const press = (y, name) => {
    t.plate(-130, y - 32, 80, 64, B, 6)
    t.box(-112, y - 18, 44, 36, B + 6, 1.2, 'hi', { flat: true })
    t.text(-90, y + 10, B + 7.3, name, 5, 'lo')
    t.cyl(-122, y, 6, B + 6, 74, 'mid', { steps: 18 })
    t.box(-128, y - 7, 44, 14, B + 72, 10, 'lo')
    t.cyl(-90, y, 4, B + 44, 28, 'mid', { steps: 14 })
    t.cyl(-90, y, 14, B + 30, 14, 'mid')
    t.cyl(-90, y, 16, B + 26, 4, 'lo')
    t.bar([-96, y], [-60, y + 20], 3, B + 84, 3, 'mid')
    t.cyl(-60, y + 20, 4, B + 82, 7, 'hi', { steps: 14 })
  }
  press(-60, 'LLM')
  press(60, 'DECISION MODEL')

  // Sorting bins: one per route, each with its signal lamp.
  bins.forEach(([tone], i) => {
    const y = -124 + i * 64
    t.tray(150, y, 120, 56, B, 30, () => {
      for (let s = 0; s < 3 - (i % 2); s++) t.box(166 + s * 6, y + 10, 70, 36, B + 3 + s * 2, 1.2, s === 2 - (i % 2) ? 'hi' : 'lo')
    }, tone === 'mid' ? 'mid' : tone)
    t.lamp([270, y + 28, B + 30], tone)
  })

  t.label([-238, 0, B + 17], 'MEETINGS + CHATS', { dy: -150 })
  t.label([-95, -132, B + 62], 'SAME RUBRIC', { dx: 110, dy: -30 })
  t.label([-70, -60, B + 84], 'GENERATIVE MODEL', { dy: -70 })
  t.label([-60, 80, B + 89], 'DECISION MODEL', { dx: -150, dy: 110 })
  bins.forEach(([tone, name], i) => t.label([270, -96 + i * 64, B + 30], name, { dx: 46, dy: 0, tone }))
}

function rfpSandbox(t) {
  t.base(-300, -140, 600, 280)
  t.rail([[-200, 0, B + 1], [-110, 0, B + 1]])
  t.rail([[118, 0, B + 1], [170, 0, B + 1]])
  const verdicts = [['green', 'SUPPORTED'], ['red', 'CONTRADICTED'], ['blue', 'STALE'], ['mid', 'UNKNOWN']]

  // Approved claims wait in a tray.
  t.tray(-284, -50, 84, 100, B, 20, () => {
    for (let i = 0; i < 5; i++) t.box(-276 + i, -40, 66, 80, B + 3 + i * 2, 1.2, i === 4 ? 'hi' : 'lo')
    for (let r = 0; r < 3; r++) t.rule([-266, -26 + r * 16], [-226 - r * 8, -26 + r * 16], B + 12.4, 'mid')
  })

  // Evidence: logs and configs on a rack behind the chamber.
  t.plate(-120, -136, 150, 24, B, 6, 'lo')
  for (let s = 0; s < 9; s++) t.box(-112 + s * 15, -132, 11, 16, B + 6, 34 + (s % 3) * 6, s % 4 ? 'mid' : 'lo')

  // The sandbox: a glass chamber around a balance.
  const top = B + 140
  const posts = [[-110, -104], [110, -104], [-110, 96], [110, 96]]
  t.plate(-114, -108, 232, 212, B, 6)
  t.outline(-106, -100, 216, 196, top, 'lo')
  for (const [x, y] of posts.slice(0, 2)) t.box(x, y, 8, 8, B + 6, top - B - 6, 'mid')
  t.cyl(4, 0, 24, B + 6, 8, 'mid')
  t.cyl(4, 0, 4, B + 14, 94, 'mid', { steps: 14 })
  t.box(-4, -2, 16, 4, B + 108, 22, 'lo')
  t.cyl(4, 0, 8, B + 104, 8, 'hi', { steps: 18 })
  t.cyl(4, 0, 1.4, B + 112, 18, 'hi', { steps: 8 })
  t.bar([4, -66], [4, 66], 5, B + 106, 4, 'mid')
  for (const y of [-66, 66]) {
    for (const dx of [-14, 14]) t.seg([4, y, B + 106], [4 + dx, y, B + 54], 'lo')
    t.cyl(4, y, 24, B + 50, 3, 'mid')
  }
  t.box(-12, -82, 32, 30, B + 53, 2, 'hi', { lit: true })
  for (const [r, h] of [[12, 6], [9, 6], [6, 6]]) t.cyl(4, 66, r, B + 53 + (12 - r) * 2, h, 'lo', { steps: 20 })
  for (const [x, y] of posts.slice(2)) t.box(x, y, 8, 8, B + 6, top - B - 6, 'mid')
  t.outline(-106, -100, 216, 196, B + 6, 'faint')
  for (const [x, y] of posts) t.seg([x + 4, y + 4, B + 6], [x + 4, y + 4, top], 'faint', { dashed: true })

  // Verdict panel: one lamp per outcome.
  t.plate(170, -100, 100, 200, B, 20)
  verdicts.forEach(([tone], i) => {
    const y = -72 + i * 48
    t.cyl(232, y, 11, B + 20, 3, 'lo')
    t.lamp([232, y, B + 23], tone, 7)
  })

  t.label([-243, 0, B + 13], 'APPROVED CLAIM', { dy: -120 })
  t.label([-50, -124, B + 46], 'EVIDENCE', { dy: -60 })
  t.label([4, -66, B + 55], 'CLAIM ON THE SCALE', { dx: -20, dy: -220 })
  verdicts.forEach(([tone, name], i) => t.label([243, -72 + i * 48, B + 22], name, { dx: 60, dy: 0, tone }))
}

function releaseGate(t) {
  t.base(-300, -150, 600, 300)
  t.rail([[-200, 0, B + 1], [0, 0, B + 1]])
  const exits = [[-80, 'red'], [0, 'blue'], [80, 'green']]
  for (const [y, tone] of exits) t.rail([[80, 0, B + 1], [118, 0, B + 1], [150, y, B + 1], [196, y, B + 1]], tone)

  // Feeder: a stack of pull-request cards for the Friday release.
  t.plate(-282, -52, 82, 104, B, 6)
  for (let i = 0; i < 5; i++) t.box(-270 + i, -36, 58, 70, B + 7 + i * 2, 1.2, i === 4 ? 'hi' : 'lo')
  for (let row = 0; row < 4; row++) t.rule([-262, -24 + row * 12], [-232 - (row % 2) * 10, -24 + row * 12], B + 17.4, 'mid')

  // Checks: three scanner arches over the rail. Two pass; security raises one alert.
  const checks = [[-150, 'green'], [-105, 'green'], [-60, 'red']]
  for (const [x, tone] of checks) {
    t.box(x - 6, -40, 12, 10, B, 46, 'mid')
    t.box(x - 6, 30, 12, 10, B, 46, 'mid')
    t.box(x - 6, -40, 12, 80, B + 46, 8, 'lo')
    t.lamp([x, 0, B + 54], tone, 6)
  }

  // Release gate: two separate locks. Parameters keep input as data; the tenant check scopes the read.
  t.plate(0, -60, 80, 120, B, 30, 'lo')
  for (const y of [-30, 30]) {
    t.cyl(40, y, 16, B + 30, 22, 'mid')
    t.cyl(40, y, 9, B + 52, 4, 'hi')
    t.box(37, y - 2, 6, 4, B + 56, 1, 'lo', { flat: true })
  }

  // Exits: a hold rack, a rerun bench, and a shipping crate.
  t.tray(200, -102, 60, 44, B, 26, () => t.box(212, -92, 36, 24, B + 3, 1.2, 'lo'), 'red')
  t.plate(200, -22, 60, 44, B, 6)
  t.cyl(230, 0, 15, B + 6, 12, 'blue')
  t.cyl(230, 0, 7, B + 18, 6, 'mid', { steps: 18 })
  t.plate(200, 58, 60, 44, B, 6)
  t.box(206, 64, 48, 32, B + 6, 26, 'green')
  t.label([-241, 0, B + 17], 'FRIDAY PULL REQUEST', { dy: -110 })
  t.label([-127, -40, B + 54], 'BUILD + TESTS PASS', { dx: -50, dy: -110, tone: 'green' })
  t.label([-60, 0, B + 54], 'ONE SECURITY ALERT', { dx: 70, dy: -130, tone: 'red' })
  t.label([40, -30, B + 56], 'QUERY PARAMETERS', { dy: -96 })
  t.label([40, 30, B + 56], 'TENANT BOUNDARY', { dx: -40, dy: 120 })
  t.label([260, -80, B + 26], 'HOLD', { dx: 50, dy: 0, tone: 'red' })
  t.label([245, 0, B + 24], 'FIX + RERUN', { dx: 70, dy: 0, tone: 'blue' })
  t.label([254, 80, B + 32], 'SHIP', { dx: 50, dy: 0, tone: 'green' })
}

function budgetInterlock(t) {
  t.base(-260, -140, 550, 270)
  t.rail([[118, -64, B + 1], [150, -64, B + 1], [150, 82, B + 1], [190, 82, B + 1]], 'blue')

  // Cycle reset: a dial on a post at the back of the box.
  t.cyl(220, -90, 7, B, 46, 'mid', { steps: 16 })
  t.dial(220, -90, 26, B + 46, -2.4)

  // Lever frame: two padlocked levers for the higher limits, then three levers pulled in order.
  t.plate(-230, -90, 345, 48, B, 18, 'lo')
  const levers = [[-195, false], [-155, false], [-80, true], [-20, true], [40, true]]
  for (const [x, pulled] of levers) {
    t.box(x - 4, -82, 8, 30, B + 18, 1, 'lo', { flat: true })
    const y = pulled ? -60 : -78
    t.box(x - 3, y, 6, 6, B + 18, 84, x === 40 ? 'blue' : pulled ? 'hi' : 'lo')
    t.box(x - 5, y - 1, 10, 8, B + 102, 6, 'mid')
    if (!pulled) t.box(x - 7, y + 8, 14, 8, B + 18, 14, 'red')
  }
  t.lamp([40, -57, B + 108], 'blue', 6)
  // The owner's release key sits in a lock on the frame beside lever 2.
  t.cyl(10, -66, 8, B + 18, 12, 'green', { steps: 18 })
  t.box(8, -74, 4, 8, B + 30, 3, 'hi')

  // Interlocking bed: tappets on the locking bars stop a lever until its prerequisite is pulled.
  t.tray(-230, -24, 345, 60, B, 16, () => {
    for (const y of [-8, 18]) t.bar([-222, y], [106, y], 3, B + 3, 3, 'mid')
    for (const [x] of levers) t.box(x - 3, -16, 6, 42, B + 6, 4, 'hi')
  })

  // Outcome panel: the person is stopped, on grace, or back to normal.
  t.plate(190, 30, 80, 100, B, 12)
  const lamps = [[50, 'red'], [80, 'blue'], [110, 'green']]
  for (const [y, tone] of lamps) {
    t.cyl(230, y, 11, B + 12, 6, 'lo', { steps: 18 })
    t.lamp([230, y, B + 18], tone, 6)
  }

  t.label([-175, -78, B + 108], 'HIGHER LIMITS: PADLOCKED', { dx: -110, dy: -50, tone: 'red' })
  t.label([-80, -60, B + 108], '1 REMOVE BROAD GRANT', { dy: -150 })
  t.label([10, -66, B + 30], '2 OWNER VERIFIES', { dx: -90, dy: 190, tone: 'green' })
  t.label([40, -57, B + 108], '3 RAISE CAP ONCE', { dx: 70, dy: -110, tone: 'blue' })
  t.label([-150, 36, B + 16], 'INTERLOCKING', { dy: 110 })
  t.label([220, -90, B + 49], 'CYCLE RESET', { dy: -90 })
  for (const [y, tone] of lamps) {
    t.label([230, y, B + 18], { red: 'STOPPED', blue: 'GRACE', green: 'NORMAL' }[tone], { dx: 70, dy: 0, tone })
  }
}

function cardCatalog(t) {
  t.base(-260, -130, 420, 190)
  const stale = 3
  const slot = s => -135 + s * 10
  const guideAt = i => slot(2 + i * 4)
  const floor = B + 28
  const cardTop = 28
  const guideTop = cardTop + 6
  const tabAt = i => -8 + (i % 3) * 13
  const heights = [52, 44, 60, 48, 56, 46]
  const spineZ = i => B + 4 + heights[i] - 8

  // Cabinet: two columns of drawer fronts; the front column's middle drawer is pulled out.
  t.box(-250, -72, 110, 112, B, 76, 'mid')
  t.outline(-247, -69, 104, 106, B + 76)
  for (let r = 0; r < 3; r++) {
    for (const [y0, y1] of [[-66, -20], [-12, 34]]) {
      const z0 = B + 4 + r * 24
      const z1 = z0 + 20
      if (r === 1 && y0 > -15) continue
      for (const [p, q] of [[[y0, z0], [y1, z0]], [[y0, z1], [y1, z1]], [[y0, z0], [y0, z1]], [[y1, z0], [y1, z1]]]) {
        t.seg([-140, p[0], p[1]], [-140, q[0], q[1]], 'lo')
      }
      const mid = (y0 + y1) / 2
      t.box(-142, mid - 7, 2, 14, z0 + 5, 3.5, 'hi')
      t.seg([-140, mid - 13, z1 - 4], [-140, mid + 13, z1 - 4], 'faint')
    }
  }

  // Sources: binders on a back shelf; every card thread ends at one.
  t.plate(-130, -126, 250, 38, B, 4, 'lo')
  heights.forEach((h, i) => {
    const x = guideAt(i)
    t.box(x - 11, -121, 22, 28, B + 4, h, i === stale ? 'lo' : 'mid')
    t.seg([x - 11, -93, B + 12], [x + 11, -93, B + 12], 'faint')
    t.seg([x - 11, -93, B + 4 + h - 8], [x + 11, -93, B + 4 + h - 8], 'faint')
  })

  // Drawer: dated cards stand upright; every fourth is a tabbed guide, and one has gone stale.
  t.tray(-142, -12, 242, 46, floor, 20, () => {
    for (let s = 0; s < 23; s++) {
      const x = slot(s)
      const i = (s - 2) / 4
      const guide = Number.isInteger(i) && i >= 0
      const old = guide && i === stale
      const h = (guide ? guideTop : cardTop) + (old ? 24 : 0)
      t.box(x, -8, 1.4, 38, floor + 3, h, old ? 'hi' : guide ? 'mid' : 'lo', old ? { lit: true } : {})
      if (guide) t.box(x, tabAt(i), 1.4, old ? 20 : 12, floor + 3 + h, old ? 11 : 5, old ? 'red' : 'hi')
    }
  })
  t.box(100, 1, 3, 20, floor + 6, 3.5, 'hi')

  for (let i = 0; i < 6; i++) {
    const bad = i === stale
    const x = guideAt(i)
    const from = floor + 3 + guideTop + (bad ? 32 : 5)
    t.seg([x, tabAt(i), from], [x, -93, spineZ(i)], bad ? 'red' : 'mid', { dashed: bad })
    t.lamp([x, -93, spineZ(i)], bad ? 'red' : 'green', 3.5)
  }
  const lines = floor + 3 + guideTop + 24
  for (const dz of [8, 15, 22]) t.seg([guideAt(stale) + 2, -4, lines - dz], [guideAt(stale) + 2, 26, lines - dz], 'faint')

  // Loupe: the check before acting.
  t.cyl(130, 18, 10, B, 3, 'mid')
  t.cyl(130, 18, 2.4, B + 3, 30, 'mid', { steps: 12 })
  t.line(k.sideRing([130, 18, B + 47], 17, 'y', t.P), 'hi')
  t.line(k.sideRing([130, 18, B + 47], 14, 'y', t.P), 'faint')

  t.label([guideAt(0), 30, floor + 3 + cardTop], 'DATED CARDS', { dx: -30, dy: 80 })
  t.label([guideAt(stale), 12, floor + 3 + guideTop + 24], 'STALE CARD', { dy: 90, tone: 'red' })
  t.label([guideAt(4), -93, spineZ(4)], 'SOURCES', { dy: -56 })
  t.label([guideAt(5), -40, floor + 27], 'THREAD TO SOURCE', { dx: 90, dy: -20 })
  t.label([130, 18, B + 47], 'CHECK FIRST', { dx: 56, dy: 0 })
}

function sealedGovernor(t) {
  t.base(-190, -90, 380, 178)
  const g = -10
  const wording = [[-166, -14], [-148, 0], [-130, 14]]

  // Wording knobs: the part the automation may turn freely.
  t.plate(-184, -28, 62, 56, B, 16, 'mid')
  for (const [x, y] of wording) {
    t.cyl(x, y, 8, B + 16, 6, 'hi', { steps: 18 })
    t.rule([x, y], [x + 5, y - 4], B + 22, 'mid')
  }
  t.rail([[-122, 0, B + 1], [g - 40, 0, B + 1]], 'green')

  // Governor: spindle, sleeve and two flying balls.
  t.cyl(g, 0, 40, B, 18, 'mid')
  t.cyl(g, 0, 27, B + 18, 12, 'lo')
  for (const dx of [-2.5, 2.5]) {
    t.seg([g + dx, 0, B + 150], [g + dx, -60, B + 112], 'mid')
    t.seg([g + dx, -60, B + 90], [g + dx, -11, B + 70], 'mid')
  }
  t.cyl(g, -60, 16, B + 86, 26, 'mid', { steps: 22 })
  t.cyl(g, 0, 5.5, B + 30, 138, 'hi', { steps: 14 })
  t.cyl(g, 0, 13, B + 152, 14, 'mid')
  t.cyl(g, 0, 7, B + 166, 5, 'hi', { steps: 14 })
  t.cyl(g, 0, 11, B + 60, 16, 'mid')
  t.cyl(g, 0, 17, B + 98, 12, 'hi', { lit: true })
  for (const dx of [-2.5, 2.5]) {
    t.seg([g + dx, 0, B + 150], [g + dx, 60, B + 112], 'mid')
    t.seg([g + dx, 60, B + 90], [g + dx, 11, B + 70], 'mid')
  }
  t.cyl(g, 60, 16, B + 86, 26, 'mid', { steps: 22 })

  // Padlock on the limit collar.
  t.box(g + 12, 6, 16, 12, B + 94, 18, 'red')
  t.line(k.sideRing([g + 20, 12, B + 115], 6, 'y', t.P), 'red')
  t.seg([g + 20, 18, B + 102], [g + 20, 18, B + 107], 'red')

  // Envelope scale: the sleeve may travel only between the stops.
  t.box(g + 66, -3, 6, 6, B, 134, 'lo')
  t.box(g + 65, -4, 8, 8, B + 60, 40, 'green')
  for (let z = 20; z < 134; z += 12) t.seg([g + 72, -3, B + z], [g + 72, 3, B + z], 'faint')
  t.seg([g + 11, 0, B + 68], [g + 66, 0, B + 68], 'faint')
  t.seg([g + 17, 0, B + 104], [g + 66, 0, B + 104], 'faint')

  // Key rack: a human holds the key that moves the collar.
  t.box(130, 40, 48, 34, B, 40, 'mid')
  t.line(k.sideRing([178, 57, B + 28], 6, 'x', t.P), 'hi')
  t.seg([178, 57, B + 22], [178, 57, B + 8], 'hi')
  t.seg([178, 57, B + 14], [178, 62, B + 14], 'hi')
  t.seg([178, 57, B + 9], [178, 61, B + 9], 'hi')
  t.lamp([154, 57, B + 40], 'blue', 5)
  t.seg([130, 57, B + 36], [g + 20, 14, B + 108], 'blue', { dashed: true })

  t.label([-148, 0, B + 22], 'WORDING TUNES FREELY', { dx: -50, dy: 0, tone: 'green' })
  t.label([g + 69, 0, B + 80], 'FIXED ENVELOPE', { dx: 80, dy: 0 })
  t.label([g + 20, 12, B + 121], 'TOOLS, TRIGGERS, BUDGET', { dx: -70, dy: -50, tone: 'red' })
  t.label([154, 57, B + 40], 'HUMAN HOLDS KEY', { dy: 70, tone: 'blue' })
}

function baggageClaim(t) {
  t.base(-260, -100, 510, 165)
  const belt = k.planOutline({ x: -224, y: -54, w: 168, d: 88, r: 44 }, B + 10.4, t.P)
  const bag = (cx, cy, angle, tone) => {
    const [ux, uy] = [Math.cos(angle), Math.sin(angle)]
    t.bar([cx - ux * 17, cy - uy * 17], [cx + ux * 17, cy + uy * 17], 22, B + 10, 18, tone)
    t.bar([cx - ux * 5, cy - uy * 5], [cx + ux * 5, cy + uy * 5], 3, B + 28, 4, 'hi')
  }

  // Carousel: a stadium belt around a low island, with bags riding it.
  t.box(-240, -70, 200, 120, B, 10, 'mid', { r: 60 })
  t.box(-206, -38, 132, 56, B + 10, 8, 'lo', { r: 28 })
  t.line(belt, 'faint')
  t.line(belt, 'green', { flow: true, className: 'decision-signal' })
  bag(-150, -54, 0, 'mid')
  bag(-224, -10, Math.PI / 2, 'hi')
  bag(-120, 34, 0, 'mid')
  bag(-69, -41, Math.PI / 4, 'lo')

  // Transfer belt: a rebuild gantry, then a customs gate with a boom barrier.
  t.box(-44, -26, 262, 32, B, 4, 'lo')
  t.rail([[-52, -10, B + 5], [20, -10, B + 5]], 'green')
  t.rail([[20, -10, B + 5], [140, -10, B + 5]], 'blue')
  t.rail([[140, -10, B + 5], [215, -10, B + 5]], 'red', false)
  t.box(22, -34, 8, 8, B, 44, 'mid')
  t.box(22, 6, 8, 8, B, 44, 'mid')
  t.box(22, -34, 8, 48, B + 44, 8, 'mid')
  t.cyl(26, -10, 12, B + 52, 6, 'hi', { steps: 20 })
  t.ring(26, -10, 7, B + 58, 'mid')
  t.lamp([26, -10, B + 62], 'blue', 5)

  t.box(130, 14, 30, 30, B, 40, 'mid')
  t.box(126, 10, 38, 38, B + 40, 5, 'hi')
  t.lamp([145, 29, B + 53], 'red', 5)
  t.box(146, 8, 8, 8, B, 20, 'lo')
  t.bar([150, 14], [150, -42], 8, B + 20, 8, 'hi', { lit: true })

  t.tray(196, -34, 44, 48, B, 14, () => {
    t.bar([206, -10], [230, -10], 14, B + 3, 10, 'green')
  })

  t.label([-150, -54, B + 28], 'HISTORY + FILES', { dy: -70, tone: 'green' })
  t.label([26, -10, B + 62], 'PROCESSES REBUILT', { dy: -80, tone: 'blue' })
  t.label([145, 48, B + 4], 'CREDENTIALS + APPROVALS', { dy: 50, tone: 'red' })
}

function twinGauges(t) {
  t.base(-230, -100, 480, 175)
  const gauge = (x, y, r, z, angle, tone, o = {}) => {
    t.cyl(x, y, r, z, 5, 'mid', { steps: 32, lit: o.lit })
    const ticks = k.radialTicks(x, y, r - 3, 22, 4, z + 5, [3, 7], t.P, -2.2, 4.4)
    t.line(ticks.minor, 'faint')
    t.line(ticks.major, 'mid')
    t.line(k.radialTicks(x, y, r - 3, 4, 1, z + 5, [8, 8], t.P, 1.0, 1.2).major, 'red')
    t.bar([x, y], [x + Math.sin(angle) * (r - 7), y - Math.cos(angle) * (r - 7)], 3, z + 5, 2, tone)
    t.cyl(x, y, 3.5, z + 5, 3, 'mid', { steps: 14 })
  }

  // One tank, two outlets: a shared manifold carrying both agents' gauges, and a separate clean line.
  t.cyl(-170, -10, 42, B, 70, 'mid')
  t.cyl(-170, -10, 34, B + 70, 4, 'lo')
  t.ring(-170, -10, 28, B + 74, 'mid')

  t.bar([-130, -42], [170, -42], 12, B + 10, 12, 'lo')
  t.rail([[-130, -42, B + 23], [170, -42, B + 23]], 'blue')

  // The fault sits upstream of both taps, so both gauges inherit it.
  t.box(-98, -52, 20, 20, B + 8, 22, 'red')
  t.lamp([-88, -42, B + 34], 'red', 5)

  t.cyl(10, -42, 13, B + 10, 28, 'lo')
  gauge(10, -42, 34, B + 38, 0.3, 'blue')
  t.cyl(100, -42, 13, B + 10, 28, 'lo')
  gauge(100, -42, 34, B + 38, 0.3, 'blue')

  t.bar([-130, 26], [170, 26], 12, B + 4, 12, 'lo')
  t.rail([[-130, 26, B + 17], [170, 26, B + 17]], 'green')
  t.cyl(170, 26, 15, B + 4, 34, 'hi')
  gauge(170, 26, 40, B + 38, 1.8, 'red', { lit: true })

  t.label([10, -42, B + 43], 'AGENT A: FINE', { dy: -60, tone: 'blue' })
  t.label([100, -42, B + 43], 'AGENT B: FINE', { dx: 90, dy: -30, tone: 'blue' })
  t.label([-88, -42, B + 34], 'SHARED FAULT', { dy: -60, tone: 'red' })
  t.label([170, 26, B + 43], 'INDEPENDENT CHECK', { dy: 70, tone: 'green' })
}

function nightWatchClock(t) {
  t.base(-150, -150, 300, 300)
  const R = 125
  const ring = Array.from({ length: 49 }, (_, i) => [Math.sin((i / 48) * Math.PI * 2) * R, -Math.cos((i / 48) * Math.PI * 2) * R, B + 2])
  const station = (x, y, keyed) => {
    t.box(x - 16, y - 16, 32, 32, B, 34, 'mid')
    t.box(x - 12, y - 12, 24, 24, B + 34, 4, 'hi')
    if (keyed) {
      t.cyl(x, y, 4.5, B + 38, 9, 'hi', { steps: 14 })
      t.bar([x, y], [x + 11, y], 4, B + 43, 3, 'green')
      t.lamp([x, y, B + 56], 'green', 5)
    } else {
      t.ring(x, y, 7, B + 38, 'red')
      t.lamp([x, y, B + 50], 'red', 5)
    }
  }

  t.rail(ring, 'mid')
  for (const [x, y, tone] of [[0, -1, 'green'], [-1, 0, 'green'], [1, 0, 'green'], [0, 1, 'red']]) {
    t.bar([x * 72, y * 72], [x * 112, y * 112], 9, B, 3, 'lo')
    t.rail([[x * 74, y * 74, B + 4], [x * 110, y * 110, B + 4]], tone, tone !== 'red')
  }
  station(0, -R, true)
  station(-R, 0, true)

  t.cyl(0, 0, 76, B, 14, 'mid')
  t.cyl(0, 0, 66, B + 14, 8, 'hi', { lit: true, steps: 40 })
  const ticks = k.radialTicks(0, 0, 62, 48, 4, B + 22, [3, 8], t.P, 0, Math.PI * 2)
  t.line(ticks.minor, 'faint')
  t.line(ticks.major, 'mid')
  t.bar([0, 0], [Math.sin(3.0) * 50, -Math.cos(3.0) * 50], 5, B + 22, 2, 'hi')
  t.cyl(0, 0, 6, B + 22, 4, 'mid', { steps: 16 })

  station(R, 0, true)
  station(0, R, false)

  t.label([-R, 0, B + 56], 'NAMED IDENTITY', { dx: -60, dy: 0, tone: 'green' })
  t.label([0, -R, B + 56], 'AUTHORITY', { dy: -60, tone: 'green' })
  t.label([R, 0, B + 56], 'BUDGET PAYER', { dx: 60, dy: 0, tone: 'green' })
  t.label([0, R, B + 50], 'FAILURE OWNER?', { dx: -90, dy: 0, tone: 'red' })
}

function reviewHopper(t) {
  t.base(-230, -100, 430, 205)
  const sheet = (x, y, angle, z, tone, w = 26, d = 18) => {
    const [ux, uy] = [Math.cos(angle), Math.sin(angle)]
    t.bar([x - ux * w / 2, y - uy * w / 2], [x + ux * w / 2, y + uy * w / 2], d, z, 1.6, tone)
  }

  // A tall, wide hopper of cheap drafts feeding one narrow lane.
  for (const [x, y] of [[-196, -56], [-96, -56], [-196, 36], [-96, 36]]) t.box(x - 5, y - 5, 10, 10, B, 62, 'lo')
  t.cyl(-146, -10, 14, B + 22, 14, 'mid')
  t.cyl(-146, -10, 30, B + 36, 14, 'mid')
  t.cyl(-146, -10, 46, B + 50, 14, 'mid')
  t.cyl(-146, -10, 62, B + 64, 14, 'mid')
  t.ring(-146, -10, 56, B + 78, 'hi')
  const heap = [[-161, -22, 0.2, 'hi'], [-126, -14, 2.4, 'mid'], [-148, -2, 1.1, 'hi'], [-166, 8, 0.6, 'mid'], [-136, -28, 0.9, 'lo'], [-151, -12, 2.0, 'hi'], [-142, -8, 0.3, 'mid'], [-156, -16, 1.5, 'hi']]
  heap.forEach(([x, y, a, tone], i) => sheet(x, y, a, B + 78 + i * 3, tone, 40, 28))

  // The lane before the gate is jammed; after it, work flows.
  t.bar([-110, -10], [-34, -10], 14, B, 5, 'lo')
  t.rail([[-110, -10, B + 6], [-38, -10, B + 6]], 'red', false)
  for (const x of [-100, -86, -72, -58]) sheet(x, -10, 0, B + 6, 'red', 10, 11)
  for (const [x, y, a] of [[-140, 76, 0.4], [-112, 86, 1.3], [-170, 90, 0.1], [-90, 72, 0.8]]) sheet(x, y, a, B, 'red', 26, 18)

  t.bar([-20, -10], [80, -10], 14, B, 5, 'lo')
  t.rail([[-20, -10, B + 6], [80, -10, B + 6]], 'green')

  t.box(-36, -34, 12, 12, B, 54, 'mid')
  t.box(-36, 14, 12, 12, B, 54, 'mid')
  t.box(-40, -34, 20, 60, B + 54, 9, 'hi', { lit: true })
  t.lamp([-30, -4, B + 68], 'blue', 5)

  t.tray(80, -44, 120, 70, B, 26, () => {
    for (let i = 0; i < 4; i++) sheet(140, -10, 0, B + 3 + i * 3, 'green', 64, 40)
  })

  t.label([-202, -10, B + 80], 'CHEAP DRAFTS', { dx: -50, dy: 0, tone: 'mid' })
  t.label([-80, -10, B + 8], 'BACKLOG', { dy: 70, tone: 'red' })
  t.label([-30, -4, B + 68], 'REVIEW CAPACITY', { dx: 80, dy: -50, tone: 'blue' })
  t.label([140, -10, B + 14], 'SHIPPED', { dy: 80, tone: 'green' })
}

function vaultWindow(t) {
  t.base(-200, -100, 410, 205)
  const sheet = (x, y, angle, z, tone, w = 26, d = 18) => {
    const [ux, uy] = [Math.cos(angle), Math.sin(angle)]
    t.bar([x - ux * w / 2, y - uy * w / 2], [x + ux * w / 2, y + uy * w / 2], d, z, 1.6, tone)
  }

  // Vault: a window on the left-front face, a round door on the right-front face.
  t.box(-180, -90, 150, 110, B, 84, 'mid')
  t.outline(-174, -84, 138, 98, B + 84)
  t.box(-166, 20, 8, 5, B + 26, 6, 'hi')
  t.box(-166, 20, 100, 5, B + 26, 6, 'hi')
  t.box(-166, 20, 100, 5, B + 70, 6, 'hi')
  t.box(-166, 20, 8, 5, B + 32, 38, 'hi')
  t.box(-74, 20, 8, 5, B + 32, 38, 'hi')
  for (const dx of [0, 26, 52]) t.seg([-158 + dx, 26, B + 34], [-122 + dx, 26, B + 68], 'green')
  t.seg([-112, 26, B + 34], [-74, 26, B + 68], 'green')
  t.line(k.sideRing([-30, -35, B + 52], 26, 'x', t.P), 'hi')
  t.line(k.sideRing([-30, -35, B + 52], 17, 'x', t.P), 'mid')
  t.seg([-30, -35 - 17, B + 52], [-30, -35 + 17, B + 52], 'mid')
  t.seg([-30, -35, B + 35], [-30, -35, B + 69], 'mid')
  t.line(k.sideRing([-30, -35, B + 52], 5, 'x', t.P), 'hi')

  // Draft counter in front of the window.
  t.box(-166, 50, 100, 34, B, 26, 'mid')
  sheet(-132, 67, 0.15, B + 26, 'blue', 34, 22)
  sheet(-100, 70, -0.2, B + 26, 'blue', 26, 18)

  // Chute: a narrow channel from the door, locked until a key turns.
  t.bar([-30, -35], [36, -35], 22, B, 14, 'lo')
  t.rail([[-30, -35, B + 15], [36, -35, B + 15]], 'red', false)
  t.box(36, -52, 34, 34, B, 44, 'hi', { lit: true })
  t.line(k.sideRing([53, -18, B + 24], 6, 'y', t.P), 'red')
  t.lamp([53, -35, B + 44], 'red', 5)
  t.bar([70, -35], [120, -35], 22, B, 14, 'lo')
  t.tray(120, -66, 80, 64, B, 24, () => {
    sheet(160, -35, 0.1, B + 3, 'mid', 44, 30)
    sheet(160, -35, -0.1, B + 5, 'hi', 44, 30)
  })

  // The key sits apart from the lock, with a person.
  t.box(34, 10, 28, 20, B, 12, 'mid')
  t.ring(42, 20, 4, B + 12, 'hi')
  t.bar([46, 20], [58, 20], 3, B + 12, 2, 'hi')
  t.lamp([48, 20, B + 20], 'blue', 4)

  t.label([-166, 22, B + 50], 'READ-ONLY WINDOW', { dx: -70, dy: 0, tone: 'green' })
  t.label([-116, 67, B + 28], 'DRAFT COUNTER', { dy: 80, tone: 'blue' })
  t.label([53, -35, B + 44], 'SUBMIT NEEDS A KEY', { dy: -80, tone: 'red' })
}

function narrationPress(t) {
  t.base(-270, -110, 540, 220)

  // Manuscript feeder: a stack of article sheets.
  t.plate(-252, -50, 74, 92, B, 6)
  for (let i = 0; i < 6; i++) t.box(-244 + i, -42, 56, 74, B + 7 + i * 2, 1.2, i === 5 ? 'hi' : 'lo')
  for (let row = 0; row < 5; row++) t.rule([-234, -30 + row * 12], [-200 - (row % 2) * 12, -30 + row * 12], B + 19.4, 'mid')
  t.rail([[-178, -4, B + 1], [-150, -4, B + 1]])

  // Sieve: prose falls through; diagram cards are caught and drop into a bin.
  t.tray(-150, -44, 64, 76, B, 18, () => {
    for (let x = -140; x < -92; x += 8) t.rule([x, -36], [x, 24], B + 4, 'faint')
    t.box(-138, -26, 24, 18, B + 4, 1.4, 'red')
  })
  t.tray(-150, 50, 64, 46, B, 22, () => {
    t.box(-138, 60, 26, 20, B + 3, 1.2, 'red')
    t.box(-132, 66, 24, 18, B + 4.2, 1.2, 'red')
  }, 'lo')
  t.rail([[-86, -4, B + 1], [-58, -4, B + 1]])

  // The loupe's stand sits behind the lathe, so it is drawn first.
  t.box(-46, -100, 14, 14, B, 52, 'lo')

  // Record lathe: the speech model cuts the same groove for the same text.
  t.plate(-58, -64, 128, 118, B, 12)
  t.cyl(4, -4, 46, B + 12, 6, 'mid')
  for (const r of [38, 30, 22]) t.ring(4, -4, r, B + 18, 'faint')
  t.cyl(4, -4, 7, B + 18, 7, 'hi', { steps: 16 })
  t.box(46, -56, 14, 14, B + 12, 22, 'lo')
  t.bar([53, -49], [20, -14], 4, B + 34, 3, 'hi')
  t.box(14, -20, 12, 12, B + 26, 8, 'mid')

  // Inspector's loupe on an arm over the groove: the one step that reads.
  t.bar([-39, -93], [-12, -36], 4, B + 52, 3, 'mid')
  t.cyl(-12, -36, 13, B + 46, 5, 'hi', { lit: true })
  t.ring(-12, -36, 8, B + 51, 'mid')
  t.lamp([-39, -93, B + 56], 'blue', 4)
  t.rail([[70, -4, B + 1], [120, -4, B + 1]], 'green')

  // Dispatch barrier with its own interlock lamps; the loupe can't lift it.
  t.plate(120, -96, 70, 26, B, 10)
  for (const [i, x] of [130, 142, 154, 166, 178].entries()) t.lamp([x, -83, B + 10], i === 4 ? 'blue' : 'green', 4)
  t.box(124, -46, 14, 14, B, 46, 'mid')
  t.box(124, 30, 14, 14, B, 46, 'mid')
  t.bar([131, -39], [131, 37], 6, B + 46, 5, 'hi')
  t.tray(170, -44, 84, 80, B, 20, () => {
    t.cyl(212, -4, 28, B + 3, 2, 'green')
    t.cyl(212, -4, 28, B + 5, 2, 'green')
    t.cyl(212, -4, 5, B + 7, 2, 'hi', { steps: 14 })
  })

  t.label([-216, -4, B + 20], 'ARTICLE TEXT', { dy: -110 })
  t.label([-112, 74, B + 24], 'DIAGRAMS STAY VISUAL', { dy: 80, tone: 'red' })
  t.label([4, -4, B + 24], 'SPEECH MODEL', { dy: 160 })
  t.label([-12, -36, B + 51], 'AGENT REVIEW', { dy: -110, tone: 'blue' })
  t.label([154, -83, B + 14], 'MERGE GATES', { dy: -80, tone: 'green' })
}

function statusRadio(t) {
  t.base(-160, -90, 320, 180)

  // The receiver's display shows state; its controls are separate.
  t.plate(-138, -70, 276, 140, B, 18, 'lo')
  t.plate(-120, -54, 150, 106, B + 18, 5, 'mid')
  t.box(-110, -44, 130, 36, B + 23, 5, 'hi')
  t.box(-105, -39, 120, 26, B + 28, 2, 'green', { lit: true })

  // Speaker cone and grille.
  t.cyl(70, -5, 43, B + 18, 13, 'mid', { steps: 36 })
  t.ring(70, -5, 35, B + 31, 'lo')
  t.ring(70, -5, 27, B + 32, 'hi')
  t.ring(70, -5, 17, B + 33, 'lo')
  t.cyl(70, -5, 8, B + 34, 3, 'mid', { steps: 18 })
  for (let x = 43; x <= 97; x += 9) {
    t.bar([x, -23], [x, 13], 1.8, B + 38, 1, 'hi')
  }

  // Tuning dial, transport keys, and small indicators.
  t.dial(-86, 34, 14, B + 24, 0.7, 'hi')
  for (const x of [-48, -18, 12]) {
    t.plate(x, 22, 20, 22, B + 23, 3, 'mid')
    t.box(x + 4, 26, 12, 14, B + 26, 2, 'hi')
  }
  for (let x = 47; x <= 83; x += 12) {
    t.cyl(x, 43, 2.5, B + 23, 2, 'blue', { steps: 12 })
  }

  // A separate shortcut stands for control outside the status-line hook.
  t.plate(152, -30, 48, 60, B, 8, 'blue')
  t.plate(160, -22, 32, 44, B + 8, 6, 'mid')
  t.box(166, -16, 20, 32, B + 14, 2, 'hi')

  t.label([-45, -26, B + 30], 'TRACK STATUS', { dx: -10, dy: -80, tone: 'green' })
  t.label([176, 0, B + 16], 'KEY SHORTCUT', { dx: 10, dy: -18, tone: 'blue' })
  t.label([-18, 32, B + 28], 'CONTROL SEPARATE', { dy: 104, tone: 'red' })
}

export const flowHeroSvg = hero => render(hero.label, hero.art)

// Labels and outcomes paraphrase each article; nothing here adds a claim the post doesn't make.
export const flowHeroes = {
  'narration-press': {
    art: narrationPress,
    label: 'An isometric record-pressing line. A stack of article sheets feeds a sieve that catches diagram cards and drops them into a bin, so diagrams stay visual. The prose reaches a record lathe, the speech model, which cuts the same groove for the same text. A loupe on an arm over the groove is the agent review, the only step that reads. A barrier with its own interlock lamps opens to a tray of finished records; the loupe cannot lift it.',
    outputs: [
      { label: 'DIAGRAMS STAY VISUAL', tone: 'red' },
      { label: 'AGENT REVIEW', tone: 'blue' },
      { label: 'MERGE GATES', tone: 'green' },
    ],
    thesis: ['The agent reviews and asks.', 'The gates decide the merge.'],
    note: 'An illustration of the pipeline in the post. It hasn’t run end to end yet.',
  },
  'status-radio': {
    art: statusRadio,
    label: 'An isometric radio console. A lit display stands for a track shown in the CLI footer. A separate keyboard shortcut represents playback control sent directly to the player, not through the status line.',
    outputs: [
      { label: 'TRACK STATUS', tone: 'green' },
      { label: 'KEY SHORTCUT', tone: 'blue' },
      { label: 'CONTROL SEPARATE', tone: 'red' },
    ],
    thesis: ['Show what matters outside.', 'Keep control separate.'],
    note: 'An illustration of the idea. The real footer is a single line of text.',
  },
  'card-catalog': {
    art: cardCatalog,
    label: 'An isometric card catalog. A cabinet has one drawer pulled out, holding dated index cards with tabbed guides. Each tab is tied by a thread to a source binder on a shelf behind it, and each source ends in a lamp. One raised card has a red tab and a red dashed thread to a red lamp: it is stale. A loupe stands at the side as the check before acting.',
    outputs: [
      { label: 'SOURCE CONFIRMED', tone: 'green' },
      { label: 'STALE: CHECK FIRST', tone: 'red' },
    ],
    thesis: ['A memory is a claim.', 'Check it before acting.'],
    note: 'An illustrative memory store. The threads and the raised card are a metaphor; nothing here was measured.',
  },
  'sealed-governor': {
    art: sealedGovernor,
    label: 'An isometric centrifugal governor. Wording knobs feed a spindle with two swinging balls and a sliding sleeve. A fixed scale beside the spindle marks the envelope the sleeve may travel, and a padlocked collar above it is the limit. A key rack with a blue lamp stands to one side: a human holds the key that moves the collar.',
    outputs: [
      { label: 'WORDING FREE', tone: 'green' },
      { label: 'HUMAN WIDENS', tone: 'blue' },
      { label: 'NO SELF-WIDEN', tone: 'red' },
    ],
    thesis: ['Tune the wording freely.', 'Widen the envelope by hand.'],
    note: 'An illustrative design for a hosted automation. Nothing here has been run.',
  },
  'baggage-claim': {
    art: baggageClaim,
    label: 'An isometric baggage carousel feeding a customs gate. Bags ride a looping belt: they are the history and files a resumed session carries. A transfer belt passes a rebuild gantry with a blue lamp, where processes are rebuilt, then a customs booth with a red lamp and a boom barrier, where credentials and approvals are re-authorized before anything leaves.',
    outputs: [
      { label: 'CARRIED', tone: 'green' },
      { label: 'REBUILT', tone: 'blue' },
      { label: 'RE-AUTHORIZED', tone: 'red' },
    ],
    thesis: ['Resume carries the history.', 'Authority is issued again.'],
    note: 'An illustrative model of resuming a session. What a given tool carries over varies, so check yours.',
  },
  'twin-gauges': {
    art: twinGauges,
    label: 'An isometric pair of gauges fed by the same pipe, plus a third independent calibration gauge. A fault upstream of the fork leaves both paired gauges reading fine, in agreement, while the separate gauge on its own clean line sits in the red zone.',
    outputs: [
      { label: 'AGREEMENT', tone: 'blue' },
      { label: 'INDEPENDENT', tone: 'green' },
      { label: 'SHARED FAULT', tone: 'red' },
    ],
    thesis: ['Agreement can be shared error.', 'An independent check settles it.'],
    note: 'An illustration of correlated error. Nothing here was measured.',
  },
  'night-watch-clock': {
    art: nightWatchClock,
    label: 'An isometric watchman\'s clock: a lit dial in the center with a sweeping hand, and four key stations on a patrol ring around it. Three stations hold a key and a green lamp, for a named identity, authority and budget payer. The fourth, the failure owner, has an empty keyhole and a red lamp.',
    outputs: [
      { label: 'OWNERS NAMED', tone: 'green' },
      { label: 'NO FAILURE OWNER', tone: 'red' },
    ],
    thesis: ['Unattended still needs an owner.', 'Name who pays and who answers.'],
    note: 'An illustrative checklist for an unattended job. Nothing here was measured.',
  },
  'review-hopper': {
    art: reviewHopper,
    label: 'An isometric wide hopper heaped with draft sheets, feeding a narrow lane that passes through one review gate. Red sheets jam the lane and spill on the deck before the gate; green sheets pass beyond it into a tray.',
    outputs: [
      { label: 'CHEAP DRAFTS', tone: 'blue' },
      { label: 'BACKLOG', tone: 'red' },
      { label: 'SHIPPED', tone: 'green' },
    ],
    thesis: ['Generation got cheap.', 'Review became the limit.'],
    note: 'An illustration of a bottleneck, not a measurement of any team.',
  },
  'vault-window': {
    art: vaultWindow,
    label: 'An isometric vault with a read-only viewing window, a draft counter and a keyed withdrawal chute. The window shows what is inside through glass. Slips are drafted on the counter. The chute only opens with a key held by a person, so submitting is separate from reading and drafting.',
    outputs: [
      { label: 'READ', tone: 'green' },
      { label: 'DRAFT', tone: 'blue' },
      { label: 'SUBMIT NEEDS A KEY', tone: 'red' },
    ],
    thesis: ['Access is capability.', 'Submitting is permission.'],
    note: 'An illustrative split of authority. Nothing here was measured.',
  },

  'agent-harness': {
    art: agentHarness,
    label: 'An isometric ticket gate for an agent harness. A tool-call card from the model passes a key board where only registered tools have a peg, then a turnstile that is the policy gate. Its three exits run the tool, hold it for approval, or drop it in a reject bin, while a paper tape journals every event.',
    outputs: [
      { label: 'RUN TOOL', tone: 'green' },
      { label: 'AWAIT APPROVAL', tone: 'blue' },
      { label: 'DENY', tone: 'red' },
    ],
    thesis: ['The model proposes a tool call.', 'The harness decides whether it runs.'],
    note: 'Simplified from the tutorial. Every path is also written as a durable event, so a run can recover after a crash.',
  },
  'budget-fallback': {
    art: budgetFallback,
    label: 'An isometric fuel rig. A main tank with its gauge on empty is the budget, closed by a red hard-stop valve. A manifold with five nozzles is the model policy, and only the cheaper-model nozzle is open, fed by a small one-time reserve tank. A separate refill tank stands for an approved budget increase.',
    outputs: [
      { label: 'HARD STOP', tone: 'red' },
      { label: 'CHEAP-MODEL GRACE', tone: 'blue' },
      { label: 'APPROVED INCREASE', tone: 'green' },
    ],
    thesis: ['A budget answers how much.', 'Model policy answers which models.'],
    note: 'The pattern from the post: an approved, expiring grace on a cheaper model, or an approved budget increase.',
  },
  'budget-interlock': {
    art: budgetInterlock,
    label: 'An isometric signal-box lever frame. Two levers for the team and organization limits are padlocked. Three levers are pulled in order: remove the broad grant, the owner verifies with a release key, and raise the cap once. An interlocking bed in front stops any lever until its prerequisite is pulled. A cycle-reset dial stands behind, and a lamp panel shows stopped, grace, or normal.',
    outputs: [
      { label: 'STOPPED', tone: 'red' },
      { label: 'GRACE', tone: 'blue' },
      { label: 'NORMAL', tone: 'green' },
    ],
    thesis: ['Restrict first, then raise.', 'Lower first, then widen.'],
    note: 'An illustrative policy for a private prototype. It hasn’t run in a pilot.',
  },
  'dns-delegation': {
    art: dnsDelegation,
    label: 'An isometric railway junction. Visitors ride in from the registrar’s booth, and a points lever, the nameserver delegation, still throws the switch toward the old station and its 404 instead of the new site. A timer post stands for the TTL that decides how long the wrong route is remembered.',
    outputs: [
      { label: 'OLD ZONE → 404', tone: 'red' },
      { label: 'NEW ZONE → SITE', tone: 'green' },
    ],
    thesis: ['The deploy moved the files.', 'The delegation still picks who answers.'],
    note: 'Illustrative failure path. Trace the delegation before changing any records.',
  },
  'action-triage': {
    art: actionTriage,
    label: 'An isometric sorting desk. Meetings and chats arrive as one evidence tray. Two identical stamp presses, a generative model and a decision model, work from the same evidence and the same rubric card, and their proposals drop into four bins: my next actions, my later list, needs review, and handoffs and records.',
    outputs: [
      { label: 'MY NEXT ACTIONS', tone: 'green' },
      { label: 'MY LATER LIST', tone: 'blue' },
      { label: 'NEEDS REVIEW', tone: 'red' },
      { label: 'HANDOFFS + RECORDS', tone: 'mid' },
    ],
    thesis: ['Capture isn’t triage.', 'Same evidence, same rubric, two models.'],
    note: 'A route is a recommendation, not proof that anyone did the work. The sample tasks are fictional.',
  },
  'rfp-sandbox': {
    art: rfpSandbox,
    label: 'An isometric test chamber. An approved vendor claim is placed on a balance inside a glass sandbox, weighed against evidence from the sandbox. A panel lights one of four verdicts: supported, contradicted, stale, or unknown.',
    outputs: [
      { label: 'SUPPORTED', tone: 'green' },
      { label: 'CONTRADICTED', tone: 'red' },
      { label: 'STALE', tone: 'blue' },
      { label: 'UNKNOWN', tone: 'mid' },
    ],
    thesis: ['What if each RFP answer', 'came with a sandbox that checks it?'],
    note: 'Illustrative flow. MFA and audit results come from hand-authored fixtures, not live telemetry.',
  },
  'release-gate': {
    art: releaseGate,
    label: 'An isometric release dock. A Friday pull request rides a rail through three check arches: build and tests light green, while the security scanner lights one red alert. The rail reaches a release gate with two separate locks, query parameters and a tenant boundary, before it splits three ways: hold, fix and rerun, or ship.',
    outputs: [
      { label: 'HOLD', tone: 'red' },
      { label: 'FIX + RERUN', tone: 'blue' },
      { label: 'SHIP', tone: 'green' },
    ],
    thesis: ['An alert starts a decision.', 'It doesn’t make one.'],
    note: 'Fictional scenario. Query parameters are not access control, so the gate needs both locks.',
  },
}
