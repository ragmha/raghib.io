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

export const flowHeroSvg = hero => render(hero.label, hero.art)

// Labels and outcomes paraphrase each article; nothing here adds a claim the post doesn't make.
export const flowHeroes = {
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
