import * as k from '../../scripts/vendor/anatomy/iso-kit.mjs'

export const decisionFigures = {
  planning: {
    number: '01',
    title: 'How an AI workflow uses effort',
    object: 'bench',
    labels: ['Think hard', 'Decide deliberately', 'Generate carefully'],
    key: [
      'Drafting bed: challenge assumptions and agree on the scope before implementation.',
      'Selector dial: make routine choices such as routing work, allowing actions or reviewing results.',
      'Press: use a capable model to generate the code, answer or other open-ended work.',
    ],
    details: [
      'The drafting bed: question assumptions and scope the work before implementation.',
      'The selector: route, gate and judge routine choices with fixed options and logged decisions.',
      'The press: use capable models for generation where the task earns the effort.',
    ],
    caption: 'Clear scope sets the machine up. Routine selectors do not replace the drafting bed or the work of the press.',
    alt: 'Three numbered mechanisms from left to right: planning and scope, routine decisions, and open-ended generation.',
  },
  layers: {
    number: '02',
    title: 'Two places decisions happen',
    object: 'decks',
    labels: ['Inside developer tools', 'Inside application systems'],
    key: [
      'Top shelf: HydraFusion chooses a workflow for a coding task.',
      'Bottom shelf: an application uses decision scores to apply its own policy.',
    ],
    details: [
      'Upper deck: HydraFusion selects Single, Cascade or Critique and returns one coherent change set.',
      'Lower deck: your application thresholds a decision model’s probabilities, with review, fallback and an audit log.',
    ],
    caption: 'Two decks, different responsibilities. This is an architectural analogy, not a claim about HydraFusion’s internal models.',
    alt: 'Two numbered shelves: coding-workflow selection on top; application decision policy below.',
  },
  patterns: {
    number: '03',
    title: 'Three decisions in a workflow',
    object: 'sorter',
    labels: ['Route', 'Gate', 'Judge'],
    key: [
      'Left dial — Route: choose where the work goes.',
      'Centre gate — Gate: allow an action, block it or ask a person to review it.',
      'Right dial — Judge: check whether the result meets the quality bar.',
    ],
    details: [
      'Route chooses the destination: a team for issue triage, or a model for a coding agent.',
      'Gate decides whether work may pass: an action in triage, or a tool call in an agent.',
      'Judge checks the result: a resolved issue, or a change that meets the agreed quality bar.',
    ],
    caption: 'Different workpieces, the same three mechanisms: select the path, permit the action, inspect the outcome.',
    alt: 'Three numbered mechanisms from left to right: choose a destination, allow or stop an action, and check the result.',
  },
  experiments: {
    number: '04',
    title: 'Eight experiments to try',
    object: 'samples',
    labels: ['Delivery', 'Security', 'Scalability', 'Governance'],
    key: [
      'Left pair — Delivery: compare issue-solving and issue-routing results.',
      'Second pair — Security: test agent-call controls and alert prioritization.',
      'Third pair — Scalability: measure classification and agent-loop latency, cost and success.',
      'Right pair — Governance: measure confidence calibration and decision consistency.',
    ],
    details: [
      'Samples 1–2: replay closed issues; test issue routing. Measure passing tests, time, cost and routing accuracy at a threshold.',
      'Samples 3–4: gate tool calls; rank scanner findings. Measure catches versus false blocks and agreement with human triage.',
      'Samples 5–6: classify records; replace only loop decisions. Measure p50/p95 latency, throughput, cost and end-to-end success.',
      'Samples 7–8: check calibration; perturb the same inputs. Measure reliability by confidence bucket and decision-flip rate.',
    ],
    caption: 'Each topic has two test cartridges. The bench illustrates the experiments; it does not display measured results.',
    alt: 'Eight samples in four numbered pairs, left to right: delivery, security, scalability and governance experiments.',
  },
  pilot: {
    number: '05',
    title: 'A pilot, step by step',
    object: 'rail',
    labels: ['1. Define', '2. Baseline', '3. Replay', '4. Set limits', '5. Shadow', '6. Roll out'],
    key: [
      'Dial 1 — Define: choose one recurring decision and name its owner, options and risk.',
      'Dial 2 — Baseline: measure quality, time and total cost today.',
      'Dial 3 — Replay: test examples the model was not tuned on.',
      'Dial 4 — Set limits: choose thresholds, review rules and time-out fallbacks.',
      'Dial 5 — Shadow: log predictions without changing live outcomes.',
      'Dial 6 — Roll out: expand only if targets hold, with monitoring and rollback.',
    ],
    details: [
      '1 / 6 — Pick one recurring decision. Name its owner, options and the cost of a mistake.',
      '2 / 6 — Measure today’s quality, time and cost per successful outcome, including corrections.',
      '3 / 6 — Replay held-out examples, including ambiguous and uncommon cases.',
      '4 / 6 — Set measured thresholds, human review and timeout fallbacks.',
      '5 / 6 — Run in shadow mode: log predictions without permission to change live outcomes.',
      '6 / 6 — Roll out gradually only when agreed targets hold, with monitoring and rollback.',
    ],
    caption: 'Commission the system one detent at a time. Selecting “Roll out” here illustrates the stage; it does not grant permission to deploy.',
    alt: 'Six numbered checkpoints from left to right: define, measure a baseline, replay examples, set limits, run in shadow mode, and roll out gradually.',
  },
}

const WIDTH = 800
const HEIGHT = 360
const BASE = { x: -155, y: -68, w: 310, d: 136, r: 8 }

export function buildDecisionFigure(variant) {
  const config = decisionFigures[variant]
  if (!config) throw new Error(`Unknown decision figure: ${variant}`)
  const envelope = k.boxCorners(BASE, -18, 0)
  if (config.object === 'bench' || config.object === 'sorter') {
    envelope.push(...k.boxCorners({ x: config.object === 'bench' ? 70 : -25, y: -27, w: 54, d: 58 }, 0, 80))
  } else if (config.object === 'decks') {
    envelope.push(...k.boxCorners({ x: -120, y: -35, w: 240, d: 70 }, 0, 86))
  } else if (config.object === 'samples') {
    envelope.push(...k.boxCorners({ x: -145, y: -50, w: 290, d: 20 }, 0, 71))
  } else {
    envelope.push(...k.boxCorners({ x: -133, y: -27, w: 266, d: 55 }, 0, 23))
  }
  const P = k.fitProjection(envelope, WIDTH, HEIGHT, {
    pad: 24, azimuth: 65, elevation: 30,
  })
  const parts = []
  let count = 0
  const at = point => k.iso(point, P)
  const line = (path, tone = 'lo') => k.lineSvg(path, { tone })
  const solid = (shape, tone = 'mid') => {
    count++
    return k.solidSvg(shape, { tone })
  }
  const slab = (plan, z, h, tone = 'mid') =>
    solid(k.slabOf(plan, z, h, P, 5, 0.6), tone)
  const cylinder = (x, y, r, z, h, tone = 'mid') =>
    solid(k.cylinder(x, y, r, z, h, P, 32, 0.4), tone)
  const screws = (plan, z) => {
    const points = k.corners(plan, 4)
    count += points.length
    return line(points.map(([x, y]) => k.ring(x, y, 1.1, z, P, 12)).join('')) +
      k.dotsSvg(points.map(([x, y]) => at([x, y, z])), { size: 0.55 })
  }
  const decoratedPlate = (plan, z, h, tone = 'mid') =>
    slab(plan, z, h, tone) +
    line(k.planOutline(k.insetPlan(plan, 2), z + h, P)) +
    screws(plan, z + h)
  const group = (body, index) =>
    k.groupSvg(body, { 'data-station': index, 'data-selected': index === 0 ? '' : undefined })

  function knob(x, y, z, radius = 5) {
    return cylinder(x, y, radius + 1, z, 1.5, 'lo') +
      cylinder(x, y, radius, z + 1.5, 5) +
      line(k.knurl(x, y, radius, z + 1.5, z + 6.5, 28, P)) +
      k.wireSvg(at([x, y, z + 6.5]), at([x + radius - 1, y, z + 6.5]), { tone: 'hi', size: 0.7 })
  }

  function dial(x, y, z, radius = 18) {
    const ticks = k.radialTicks(x, y, radius - 3, 40, 5, z + 9, [1.1, 2.8], P)
    return cylinder(x, y, radius + 1, z, 3, 'lo') +
      cylinder(x, y, radius, z + 3, 6, 'hi') +
      line(k.ring(x, y, radius - 2, z + 9, P)) +
      line(ticks.minor) + line(ticks.major, 'mid') +
      k.wireSvg(at([x, y, z + 9]), at([x + radius - 5, y, z + 9]), { tone: 'hi', size: 0.8 })
  }

  function draftingBed(x) {
    const bed = { x: x - 30, y: -24, w: 60, d: 54, r: 3 }
    return decoratedPlate(bed, 0, 12) +
      slab(k.insetPlan(bed, 7), 12, 0.8, 'hi') +
      [-12, -4, 4, 12].map(y =>
        k.wireSvg(at([x - 18, y, 13]), at([x + 18, y, 13]), { tone: 'lo', size: 0.6 }),
      ).join('') +
      decoratedPlate({ x: x - 25, y: -27, w: 50, d: 8, r: 1 }, 13, 2) +
      knob(x + 21, 22, 13, 3)
  }

  function selector(x, y = 0, z = 0) {
    const plan = { x: x - 27, y: y - 27, w: 54, d: 54, r: 4 }
    return decoratedPlate(plan, z, 11) + dial(x, y, z + 11) +
      knob(x + 19, y + 18, z + 11, 3)
  }

  function press(x, gate = false) {
    const base = { x: x - 28, y: -27, w: 56, d: 58, r: 3 }
    const rods = [-19, 19].map(dx =>
      cylinder(x + dx, -17, 4.3, 8, 4, 'lo') +
      cylinder(x + dx, -17, 2.2, 12, 50) +
      cylinder(x + dx, -17, 4, 62, 3),
    ).join('')
    return decoratedPlate(base, 0, 8) + rods +
      cylinder(x, -17, 3, 45, 20, 'hi') +
      decoratedPlate({ x: x - 15, y: -22, w: 30, d: gate ? 10 : 28, r: 2 }, 37, 8, 'hi') +
      slab({ x: x - 15, y: -8, w: 30, d: 27, r: 2 }, 8, 4) +
      decoratedPlate({ x: x - 25, y: -24, w: 50, d: 14, r: 2 }, 65, 8) +
      knob(x, -17, 73, 5)
  }

  // A heavy base, feet, fasteners, an inset scale and captive end stops.
  for (const [x, y] of k.corners(BASE, 17).sort((a, b) =>
    k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    parts.push(cylinder(x, y, 7, -18, 4, 'lo'), cylinder(x, y, 5, -14, 4, 'lo'))
  }
  parts.push(decoratedPlate(BASE, -10, 10, 'lo'))
  const scale = { x: -138, y: 52, w: 276, d: 7, r: 1 }
  const ticks = k.topTicks(-132, 132, 4, 5, 53, 0.8, [2, 4], P)
  parts.push(slab(scale, 0, 0.8, 'lo'), line(ticks.minor), line(ticks.major, 'mid'))
  parts.push(k.dotsSvg([at([-135, 55, 0.8]), at([135, 55, 0.8])], { size: 0.7 }))

  if (config.object === 'bench' || config.object === 'sorter') {
    const builders = config.object === 'bench'
      ? [draftingBed, selector, x => press(x)]
      : [selector, x => press(x, true), x =>
          decoratedPlate({ x: x - 24, y: -24, w: 48, d: 48, r: 4 }, 0, 20) + dial(x, 0, 20)]
    for (const [i, x] of [-96, 0, 96].entries()) parts.push(group(builders[i](x), i))
  } else if (config.object === 'decks') {
    const deck = { x: -115, y: -32, w: 230, d: 66, r: 4 }
    // Corner posts leave the working faces open, unlike opaque end walls.
    for (const [x, y] of k.corners(deck, 5)) {
      parts.push(slab({ x: x - 2, y: y - 2, w: 4, d: 4, r: 1 }, 0, 60))
    }
    for (const i of [1, 0]) {
      const z = i === 0 ? 60 : 6
      const mechanisms = [-74, 0, 74].map(x =>
        decoratedPlate({ x: x - 25, y: -23, w: 50, d: 46, r: 3 }, z + 5, 5) +
        dial(x, 0, z + 10, 14),
      ).join('')
      parts.push(group(decoratedPlate(deck, z, 5) + mechanisms, i))
    }
  } else if (config.object === 'samples') {
    for (let i = 0; i < 4; i++) {
      const x = -111 + i * 74
      const sockets = [-24, 12].map(y => {
        const seat = { x: x - 22, y: y - 14, w: 44, d: 28, r: 2 }
        return decoratedPlate(seat, 0, 6) +
          slab(k.insetPlan(seat, 5), 6, 5, 'hi') +
          dial(x, y, 11, 8)
      }).join('')
      parts.push(group(sockets, i))
    }
    // Inspecting bridge with end shoes and adjustment wheels.
    for (const x of [-145, 133]) {
      parts.push(decoratedPlate({ x, y: -50, w: 12, d: 20, r: 2 }, 0, 56))
    }
    parts.push(decoratedPlate({ x: -145, y: -48, w: 290, d: 12, r: 2 }, 56, 8))
    parts.push(knob(-126, -42, 64), knob(126, -42, 64))
  } else {
    parts.push(slab({ x: -140, y: -5, w: 280, d: 8, r: 2 }, 0, 5))
    for (let i = 0; i < 6; i++) {
      const x = -115 + i * 46
      const mount = { x: x - 18, y: -27, w: 36, d: 55, r: 2 }
      parts.push(group(decoratedPlate(mount, 5, 7) +
        cylinder(x, 0, 10, 12, 5) +
        cylinder(x, 0, 7, 17, 5, 'hi') +
        line(k.knurl(x, 0, 7, 17, 22, 28, P)), i))
    }
    for (const x of [-147, 139]) {
      parts.push(decoratedPlate({ x, y: -11, w: 8, d: 20, r: 2 }, 0, 13))
    }
  }

  // One physical indicator shares the same selected state as the text readout.
  const positions = config.labels.map((_, i) => {
    const x = -120 + (240 * i) / (config.labels.length - 1)
    const marker = slab({ x: x - 4, y: 43, w: 8, d: 8, r: 1 }, 0, 3, 'hi')
    return k.groupSvg(marker, { 'data-indicator': i, visibility: i === 0 ? 'visible' : 'hidden' })
  })
  parts.push(...positions)
  return {
    parts: count,
    svg: k.figureSvg({ width: WIDTH, height: HEIGHT, label: config.alt, body: parts }),
  }
}
