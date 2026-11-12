---
title: "Self-Healing Operations"
description: "A diagram-led introduction to AI-assisted modernization and safer operations with GitHub and Azure."
date: "2026-11-12"
kind: "talk"
paginate: true
style: |
  section.diagram-slide { position: relative; justify-content: flex-start; padding: 0; }
  section.diagram-slide h2 { position: absolute; z-index: 2; top: 48px; left: 64px; margin: 0; font-size: 40px; }
  section.diagram-slide .ops-diagram { position: absolute; z-index: 1; inset: 0; display: block; width: 100%; height: 100%; max-height: none; flex: none; }
  section.diagram-slide::after { z-index: 3; }
  .ops-diagram text { fill: var(--theme-text, #fff); font-family: "JetBrains Mono", ui-monospace, monospace; text-anchor: middle; }
  .ops-diagram text[text-anchor="start"] { text-anchor: start; }
  .ops-diagram .canvas { fill: var(--theme-bg, #000); }
  .ops-diagram .node { fill: var(--theme-surface, #181818); stroke: var(--theme-rule-strong, #424242); stroke-width: 2; }
  .ops-diagram .focus { stroke: var(--theme-highlight, #dcdcdc); stroke-width: 3; }
  .ops-diagram .edge { fill: none; stroke: var(--theme-muted, #b9b9b9); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .ops-diagram .dashed { stroke-dasharray: 6 5; }
  .ops-diagram .label { font-size: 16px; font-weight: 700; }
  .ops-diagram .detail { fill: var(--theme-muted, #b9b9b9); font-size: 12px; }
  .ops-diagram .small { fill: var(--theme-muted, #b9b9b9); font-size: 12px; }
  .ops-diagram .eyebrow { fill: var(--theme-faint, #8f8f8f); font-size: 8px; font-weight: 500; letter-spacing: 1.44px; }
  .ops-diagram .route-label { fill: var(--theme-muted, #b9b9b9); font-size: 12px; letter-spacing: 0.72px; }
  .ops-diagram .mask { fill: var(--theme-bg, #000); }
  section.diagram-slide .caption { margin: 8px 0 0; color: var(--theme-muted, #b9b9b9); font-size: 12px; text-align: center; }
  section.ops-sources { font-size: 22px; }
  section.ops-sources li { margin: 0.2em 0; }
---

<!-- _class: cover -->
<!-- _paginate: false -->

## Self-Healing Operations

Two loops. One reviewed handoff.

Raghib Hasan

<!--
This talk explains two connected jobs: modernizing software and restoring service safely.
It is a conceptual walkthrough and a proposed nonproduction exercise, not a report of a completed deployment.
-->

---

<!-- _class: diagram-slide -->

## Two loops, one handoff

<svg class="ops-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="loops-title loops-desc">
  <title id="loops-title">Two loops, one handoff</title>
  <desc id="loops-desc">A software change moves from assessment through deployment. An operations loop observes, investigates, acts, and verifies. A recurring incident feeds the next reviewed change.</desc>
  <defs>
    <marker id="loops-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-muted, #b9b9b9)"/></marker>
    <marker id="loops-arrow-focus" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-highlight, #dcdcdc)"/></marker>
  </defs>
  <rect class="canvas" width="1280" height="720"/>
  <text class="eyebrow" x="116" y="268">MODERNIZE</text>
  <text class="eyebrow" x="116" y="484">OPERATE</text>
  <path class="edge" d="M64 204H1216M64 384H1216M64 540H1216"/>
  <g class="edge" marker-end="url(#loops-arrow)">
    <path d="M416 264H480M664 264H728M912 264H976"/>
    <path d="M440 480H540M740 480H840"/>
    <path class="dashed" d="M1068 228V188Q1068 180 1060 180H332Q324 180 324 188V228"/>
    <path class="dashed" d="M940 516V584Q940 592 932 592H348Q340 592 340 584V516"/>
    <path class="dashed" d="M1040 480H1148Q1156 480 1156 472V348Q1156 340 1148 340H216Q208 340 208 332V280Q208 272 216 272H232" marker-end="url(#loops-arrow-focus)"/>
  </g>
  <rect class="mask" x="568" y="156" width="144" height="12" rx="2"/>
  <text class="route-label" x="640" y="166">NEXT CHANGE</text>
  <rect class="mask" x="568" y="308" width="144" height="12" rx="2"/>
  <text class="route-label" x="640" y="318">INCIDENT EVIDENCE</text>
  <rect class="mask" x="580" y="560" width="120" height="12" rx="2"/>
  <text class="route-label" x="640" y="570">OBSERVE AGAIN</text>
  <rect class="node" x="232" y="228" width="184" height="72" rx="6"/>
  <rect class="node" x="480" y="228" width="184" height="72" rx="6"/>
  <rect class="node focus" x="728" y="228" width="184" height="72" rx="6"/>
  <rect class="node" x="976" y="228" width="184" height="72" rx="6"/>
  <rect class="node" x="240" y="444" width="200" height="72" rx="6"/>
  <rect class="node" x="540" y="444" width="200" height="72" rx="6"/>
  <rect class="node" x="840" y="444" width="200" height="72" rx="6"/>
  <text class="label" x="324" y="272">Assess</text>
  <text class="label" x="572" y="272">Change</text>
  <text class="label" x="820" y="272">Review</text>
  <text class="label" x="1068" y="272">Deploy</text>
  <text class="label" x="340" y="488">Observe</text>
  <text class="label" x="640" y="488">Investigate + act</text>
  <text class="label" x="940" y="488">Verify</text>
</svg>

<!--
Modernization changes the application over time. Incident response restores an acceptable operating state.
The loops connect through evidence: a recurring incident can become an issue with logs, a reproduction, and a proposed durable fix.
"ZeroOps" describes an ambition to reduce toil, not the disappearance of operational responsibility.
-->

---

<!-- _class: diagram-slide -->

## Agents propose. Runtimes enforce.

<svg class="ops-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="runtime-title runtime-desc">
  <title id="runtime-title">Agent proposal and runtime controls</title>
  <desc id="runtime-desc">Evidence informs an agent's tool proposal. The runtime checks resource permissions and action policies before a tool runs, then returns its result to the agent.</desc>
  <defs>
    <marker id="runtime-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-muted, #b9b9b9)"/></marker>
  </defs>
  <rect class="canvas" width="1280" height="720"/>
  <rect x="96" y="408" width="1072" height="200" rx="4" fill="var(--theme-surface, #181818)" stroke="var(--theme-rule-strong, #424242)" stroke-width="1"/>
  <rect x="96" y="408" width="40" height="16" rx="2" fill="var(--theme-bg, #000)" stroke="var(--theme-rule-strong, #424242)" stroke-width="1"/>
  <text class="eyebrow" x="116" y="420">ALT</text>
  <line x1="104" y1="536" x2="1160" y2="536" stroke="var(--theme-rule-strong, #424242)" stroke-width="1" stroke-dasharray="4 3"/>
  <text class="small" x="120" y="448" text-anchor="start">[APPROVED]</text>
  <text class="small" x="120" y="556" text-anchor="start">[DENIED]</text>
  <g class="edge">
    <line class="dashed" x1="128" y1="224" x2="128" y2="636" stroke="var(--theme-muted, #b9b9b9)" stroke-width="1" stroke-dasharray="3 3"/>
    <line class="dashed" x1="384" y1="224" x2="384" y2="636" stroke="var(--theme-muted, #b9b9b9)" stroke-width="1" stroke-dasharray="3 3"/>
    <line class="dashed" x1="640" y1="224" x2="640" y2="636" stroke="var(--theme-muted, #b9b9b9)" stroke-width="1" stroke-dasharray="3 3"/>
    <line class="dashed" x1="896" y1="224" x2="896" y2="636" stroke="var(--theme-muted, #b9b9b9)" stroke-width="1" stroke-dasharray="3 3"/>
    <line class="dashed" x1="1152" y1="224" x2="1152" y2="636" stroke="var(--theme-muted, #b9b9b9)" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="380" y1="252" x2="388" y2="252" stroke="var(--theme-muted, #b9b9b9)" stroke-width="8"/>
    <line x1="636" y1="300" x2="644" y2="300" stroke="var(--theme-muted, #b9b9b9)" stroke-width="8"/>
    <line x1="892" y1="456" x2="900" y2="456" stroke="var(--theme-muted, #b9b9b9)" stroke-width="8"/>
    <line x1="1148" y1="492" x2="1156" y2="492" stroke="var(--theme-muted, #b9b9b9)" stroke-width="8"/>
  </g>
  <g class="edge" marker-end="url(#runtime-arrow)">
    <path d="M128 256H384"/>
    <path d="M384 304H640"/>
    <path class="dashed" d="M640 352H384"/>
    <path d="M384 384H896"/>
    <path class="dashed" d="M896 464H384"/>
    <path d="M384 492H1152"/>
    <path class="dashed" d="M1152 520H384"/>
    <path class="dashed" d="M896 584H384"/>
    <path class="dashed" d="M384 632H128"/>
  </g>
  <rect class="mask" x="216" y="234" width="80" height="12" rx="2"/>
  <text class="route-label" x="256" y="244">PROPOSE</text>
  <rect class="mask" x="484" y="282" width="56" height="12" rx="2"/>
  <text class="route-label" x="512" y="292">SCOPE</text>
  <rect class="mask" x="472" y="330" width="80" height="12" rx="2"/>
  <text class="route-label" x="512" y="340">ROLE ALLOWS</text>
  <rect class="mask" x="600" y="362" width="80" height="12" rx="2"/>
  <text class="route-label" x="640" y="372">REQUEST REVIEW</text>
  <rect class="mask" x="600" y="442" width="80" height="12" rx="2"/>
  <text class="route-label" x="640" y="452">APPROVE</text>
  <rect class="mask" x="728" y="470" width="80" height="12" rx="2"/>
  <text class="route-label" x="768" y="480">INVOKE</text>
  <rect class="mask" x="728" y="498" width="80" height="12" rx="2"/>
  <text class="route-label" x="768" y="508">RESULT</text>
  <rect class="mask" x="600" y="562" width="80" height="12" rx="2"/>
  <text class="route-label" x="640" y="572">DENY</text>
  <rect class="mask" x="216" y="610" width="80" height="12" rx="2"/>
  <text class="route-label" x="256" y="620">REPORT</text>
  <rect class="node" x="48" y="160" width="160" height="64" rx="6"/>
  <rect class="node focus" x="304" y="160" width="160" height="64" rx="6"/>
  <rect class="node" x="560" y="160" width="160" height="64" rx="6"/>
  <rect class="node" x="816" y="160" width="160" height="64" rx="6"/>
  <rect class="node" x="1072" y="160" width="160" height="64" rx="6"/>
  <text class="label" x="128" y="198">Agent</text>
  <text class="label" x="384" y="198">Runtime</text>
  <text class="label" x="640" y="190">Resource roles</text>
  <text class="detail" x="640" y="210">what can it reach?</text>
  <text class="label" x="896" y="198">Human</text>
  <text class="label" x="1152" y="198">Tool</text>
</svg>

<!--
The model does not directly restart a service. A runtime invokes a tool under configured permissions and policies.
Resource permissions answer what an identity can access. Approval and tool policy answer which actions need consent or are denied.
Review mode gates Azure infrastructure actions; other connector actions need their own policies or hooks.
Reference: https://learn.microsoft.com/en-us/azure/sre-agent/run-modes
-->

---

<!-- _class: diagram-slide -->

## One app, one operating loop

<svg class="ops-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="architecture-title architecture-desc">
  <title id="architecture-title">GitHub and Azure operating architecture</title>
  <desc id="architecture-desc">GitHub Actions deploys a reviewed repository change to App Service. Azure Monitor sends signals to an SRE agent, which uses repository context and proposes a scoped action for approval.</desc>
  <defs>
    <marker id="architecture-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-muted, #b9b9b9)"/></marker>
    <marker id="architecture-arrow-focus" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-highlight, #dcdcdc)"/></marker>
  </defs>
  <rect class="canvas" width="1280" height="720"/>
  <text class="eyebrow" x="332" y="192">GITHUB</text>
  <text class="eyebrow" x="960" y="192">AZURE</text>
  <line x1="640" y1="200" x2="640" y2="520" stroke="var(--theme-rule-strong, #424242)" stroke-width="1"/>
  <g class="edge" marker-end="url(#architecture-arrow)">
    <path d="M280 288H384"/>
    <path d="M584 288H760" marker-end="url(#architecture-arrow-focus)"/>
    <path d="M960 288H1040"/>
    <path d="M1128 332V384Q1128 392 1120 392H1000Q992 392 992 400V468Q992 476 984 476H960"/>
    <path d="M860 432V332"/>
    <path class="dashed" d="M180 332V552Q180 560 188 560H852Q860 560 860 552V520"/>
  </g>
  <rect class="mask" x="620" y="266" width="104" height="12" rx="2"/>
  <text class="route-label" x="672" y="276">REVIEW + SHIP</text>
  <rect class="mask" x="1024" y="368" width="72" height="12" rx="2"/>
  <text class="route-label" x="1060" y="378">SIGNALS</text>
  <rect class="mask" x="792" y="376" width="60" height="12" rx="2"/>
  <text class="route-label" x="822" y="386">ACTION</text>
  <rect class="mask" x="464" y="538" width="112" height="12" rx="2"/>
  <text class="route-label" x="520" y="548">CODE CONTEXT</text>
  <rect class="node" x="80" y="244" width="200" height="88" rx="6"/>
  <rect class="node" x="384" y="244" width="200" height="88" rx="6"/>
  <rect class="node focus" x="760" y="244" width="200" height="88" rx="6"/>
  <rect class="node" x="1040" y="244" width="176" height="88" rx="6"/>
  <rect class="node" x="760" y="432" width="200" height="88" rx="6"/>
  <text class="label" x="180" y="280">GitHub repo</text>
  <text class="detail" x="180" y="304">code + runbook</text>
  <text class="label" x="484" y="280">GitHub Actions</text>
  <text class="detail" x="484" y="304">tests + deploy</text>
  <text class="label" x="860" y="280">App Service</text>
  <text class="detail" x="860" y="304">one nonproduction app</text>
  <text class="label" x="1128" y="280">Azure Monitor</text>
  <text class="detail" x="1128" y="304">telemetry</text>
  <text class="label" x="860" y="468">SRE Agent</text>
  <text class="detail" x="860" y="492">investigate + propose</text>
</svg>

<!--
This is a logical architecture, not a network or resource-containment diagram.
Start with one nonproduction App Service application. Keep application code, infrastructure definitions, tests, and an operational runbook together in the repository.
The approval gate represents human consent plus tool policies; the agent's identity separately needs the required resource permission.
Repository Code Access and GitHub issue/workflow connectors are separate capabilities.
References: https://learn.microsoft.com/en-us/azure/sre-agent/github-connector and https://learn.microsoft.com/en-us/azure/sre-agent/overview
-->

---

<!-- _class: diagram-slide -->

## Upgrade code. Plan the migration.

<svg class="ops-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="modernize-title modernize-desc">
  <title id="modernize-title">Two paths to a tested change</title>
  <desc id="modernize-desc">From an existing application, upgrade frameworks and dependencies or assess a platform migration. Test actual behavior before reviewing and deploying either change.</desc>
  <defs>
    <marker id="modernize-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-muted, #b9b9b9)"/></marker>
  </defs>
  <rect class="canvas" width="1280" height="720"/>
  <g class="edge" marker-end="url(#modernize-arrow)">
    <path d="M224 292H296"/>
    <path d="M464 292H512Q520 292 520 284V246Q520 238 528 238H568"/>
    <path d="M380 344V410Q380 418 388 418H568"/>
    <path d="M776 238H792Q800 238 800 246V296Q800 304 808 304H856"/>
    <path d="M776 418H816Q824 418 824 410V352Q824 344 832 344H856"/>
    <path d="M1040 318H1088"/>
  </g>
  <rect class="mask" x="464" y="268" width="40" height="12" rx="2"/>
  <text class="route-label" x="484" y="278">CODE</text>
  <rect class="mask" x="420" y="394" width="80" height="12" rx="2"/>
  <text class="route-label" x="460" y="404">PLATFORM</text>
  <ellipse class="terminal" cx="144" cy="292" rx="80" ry="36" fill="var(--theme-surface, #181818)" stroke="var(--theme-rule-strong, #424242)" stroke-width="2"/>
  <path class="node" d="M380 240 464 292 380 344 296 292Z"/>
  <rect class="node" x="568" y="200" width="208" height="76" rx="6"/>
  <rect class="node" x="568" y="380" width="208" height="76" rx="6"/>
  <rect class="node" x="856" y="280" width="184" height="76" rx="6"/>
  <ellipse class="terminal" cx="1164" cy="318" rx="76" ry="38" fill="var(--theme-surface, #181818)" stroke="var(--theme-rule-strong, #424242)" stroke-width="2"/>
  <text class="label" x="144" y="298">App</text>
  <text class="label" x="380" y="298">Change scope?</text>
  <text class="label" x="672" y="232">Upgrade code</text>
  <text class="detail" x="672" y="256">framework + packages</text>
  <text class="label" x="672" y="412">Plan migration</text>
  <text class="detail" x="672" y="436">assess readiness</text>
  <text class="label" x="948" y="312">Test behavior</text>
  <text class="label" x="1164" y="312">Deploy</text>
  <text class="detail" x="1164" y="336">after review</text>
</svg>

<!--
An upgrade changes frameworks, dependencies, and project formats. A migration assesses readiness and plans supported changes for a target platform.
The work can be done separately or together. Build success alone does not establish that business behavior is unchanged.
References: https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-upgrade/overview and https://learn.microsoft.com/en-us/azure/developer/github-copilot-app-modernization/overview
-->

---

<!-- _class: diagram-slide -->

## Recovery must be verified

<svg class="ops-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="recovery-title recovery-desc">
  <title id="recovery-title">A bounded incident recovery</title>
  <desc id="recovery-desc">A sandbox alert moves through investigation, proposal, reviewed action, and a user-journey check. Verification ends in recovered or escalated, without an automatic retry loop.</desc>
  <defs>
    <marker id="recovery-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-muted, #b9b9b9)"/></marker>
    <marker id="recovery-arrow-focus" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-highlight, #dcdcdc)"/></marker>
  </defs>
  <rect class="canvas" width="1280" height="720"/>
  <text class="eyebrow" x="128" y="220" text-anchor="start">PRIMARY PHASES</text>
  <text class="eyebrow" x="128" y="400" text-anchor="start">WAIT / REVIEW</text>
  <text class="eyebrow" x="128" y="564" text-anchor="start">TERMINAL OUTCOMES</text>
  <line x1="128" y1="384" x2="1200" y2="384" stroke="var(--theme-rule-strong, #424242)" stroke-width="1"/>
  <line x1="128" y1="544" x2="1200" y2="544" stroke="var(--theme-rule-strong, #424242)" stroke-width="1"/>
  <g class="edge" marker-end="url(#recovery-arrow)">
    <path d="M344 292H424"/>
    <path d="M512 328V408"/>
    <path d="M600 440H640Q648 440 648 432V376Q648 368 656 368H760Q768 368 768 360V328"/>
    <path d="M856 292H936"/>
    <path d="M992 328V416Q992 424 984 424H748Q740 424 740 432V568" marker-end="url(#recovery-arrow-focus)"/>
    <path d="M1072 328V568"/>
    <path d="M512 472V504Q512 512 520 512H1024Q1032 512 1032 520V568"/>
  </g>
  <rect class="mask" x="520" y="344" width="56" height="12" rx="2"/>
  <text class="route-label" x="548" y="354">REVIEW</text>
  <rect class="mask" x="664" y="348" width="88" height="12" rx="2"/>
  <text class="route-label" x="708" y="358">APPROVED</text>
  <rect class="mask" x="840" y="404" width="48" height="12" rx="2"/>
  <text class="route-label" x="864" y="414">PASS</text>
  <rect class="mask" x="1080" y="448" width="48" height="12" rx="2"/>
  <text class="route-label" x="1104" y="458">FAIL</text>
  <rect class="mask" x="760" y="492" width="72" height="12" rx="2"/>
  <text class="route-label" x="796" y="502">DENIED</text>
  <rect class="node" x="168" y="256" width="176" height="72" rx="8"/>
  <rect class="node" x="424" y="256" width="176" height="72" rx="8"/>
  <rect class="node" x="680" y="256" width="176" height="72" rx="8"/>
  <rect class="node" x="936" y="256" width="176" height="72" rx="8"/>
  <rect class="node dashed" x="424" y="408" width="176" height="64" rx="8"/>
  <rect class="node focus" x="640" y="568" width="200" height="72" rx="8"/>
  <rect class="node" x="1000" y="568" width="200" height="72" rx="8"/>
  <text class="label" x="256" y="300">Alert</text>
  <text class="label" x="512" y="300">Inspect + propose</text>
  <text class="label" x="768" y="300">Act</text>
  <text class="label" x="1024" y="300">Verify</text>
  <text class="label" x="512" y="436">Await approval</text>
  <text class="detail" x="512" y="456">human consent</text>
  <text class="label" x="740" y="612">Recovered</text>
  <text class="label" x="1100" y="612">Escalate</text>
</svg>

<!--
Connect telemetry and an availability alert to SRE Agent. Set the response plan to Review before stopping a nonproduction app.
Inspect the diagnosis and proposed start action; approve only the action scoped to that application.
Check the endpoint and a representative user journey. The pass/fail branches are the outcome; command success alone is not recovery.
The example's consecutive checks and one-attempt limit are proposed lab rules, not measured results or production objectives.
Reference: https://learn.microsoft.com/en-us/azure/sre-agent/run-modes
-->

---

<!-- _class: diagram-slide -->

## Permission is not approval

<svg class="ops-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="controls-title controls-desc">
  <title id="controls-title">Five independent operating controls</title>
  <desc id="controls-desc">Scoped identity, Azure action review, connector policies, GitHub release protections, and post-action health checks govern different parts of operation.</desc>
  <defs>
    <marker id="controls-down" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--theme-muted, #b9b9b9)"/></marker>
  </defs>
  <rect class="canvas" width="1280" height="720"/>
  <text class="eyebrow" x="88" y="164" text-anchor="start">ENFORCEMENT SURFACE</text>
  <text class="eyebrow" x="600" y="164">CONTROL · ACTOR · TIMING</text>
  <text class="eyebrow" x="1076" y="164">EXCEPTION / GAP</text>
  <path d="M44 192V528" fill="none" stroke="var(--theme-muted, #b9b9b9)" stroke-width="1.5" marker-end="url(#controls-down)"/>
  <rect class="node" x="64" y="184" width="1152" height="64" rx="0"/>
  <rect class="node focus" x="64" y="256" width="1152" height="64" rx="0"/>
  <rect class="node" x="64" y="328" width="1152" height="64" rx="0"/>
  <rect class="node" x="64" y="400" width="1152" height="64" rx="0"/>
  <rect class="node" x="64" y="472" width="1152" height="64" rx="0"/>
  <text class="eyebrow" x="88" y="208" text-anchor="start">01</text>
  <text class="label" x="88" y="232" text-anchor="start">Identity</text>
  <text class="detail" x="320" y="212" text-anchor="start">Workload identity</text>
  <text class="eyebrow" x="320" y="232" text-anchor="start">PLATFORM · RUN</text>
  <text class="detail" x="520" y="212" text-anchor="start">Resource roles</text>
  <text class="eyebrow" x="520" y="232" text-anchor="start">PLATFORM · RUN</text>
  <text class="detail" x="720" y="212" text-anchor="start">Scope limits</text>
  <text class="eyebrow" x="720" y="232" text-anchor="start">PLATFORM · RUN</text>
  <text class="detail" x="936" y="220" text-anchor="start">Emergency access not specified</text>
  <text class="eyebrow" x="88" y="280" text-anchor="start">02</text>
  <text class="label" x="88" y="304" text-anchor="start">Action policy</text>
  <text class="detail" x="320" y="284" text-anchor="start">Azure review</text>
  <text class="eyebrow" x="320" y="304" text-anchor="start">HUMAN · RUN</text>
  <text class="detail" x="520" y="284" text-anchor="start">Connector policy</text>
  <text class="eyebrow" x="520" y="304" text-anchor="start">PLATFORM · RUN</text>
  <text class="detail" x="720" y="284" text-anchor="start">Tool hooks</text>
  <text class="eyebrow" x="720" y="304" text-anchor="start">PLATFORM · RUN</text>
  <text class="detail" x="936" y="284" text-anchor="start">Other tools: define separately</text>
  <text class="eyebrow" x="88" y="352" text-anchor="start">03</text>
  <text class="label" x="88" y="376" text-anchor="start">Merge</text>
  <text class="detail" x="320" y="356" text-anchor="start">Required review</text>
  <text class="eyebrow" x="320" y="376" text-anchor="start">HUMAN · MERGE</text>
  <text class="detail" x="520" y="356" text-anchor="start">Branch rules</text>
  <text class="eyebrow" x="520" y="376" text-anchor="start">PLATFORM · MERGE</text>
  <text class="detail" x="720" y="356" text-anchor="start">Required tests</text>
  <text class="eyebrow" x="720" y="376" text-anchor="start">CODE · MERGE</text>
  <text class="detail" x="936" y="364" text-anchor="start">Bypass route not specified</text>
  <text class="eyebrow" x="88" y="424" text-anchor="start">04</text>
  <text class="label" x="88" y="448" text-anchor="start">Deploy</text>
  <text class="detail" x="320" y="428" text-anchor="start">Environment gate</text>
  <text class="eyebrow" x="320" y="448" text-anchor="start">HUMAN · DEPLOY</text>
  <text class="detail" x="520" y="428" text-anchor="start">OIDC identity</text>
  <text class="eyebrow" x="520" y="448" text-anchor="start">PLATFORM · DEPLOY</text>
  <text class="detail" x="720" y="428" text-anchor="start">Release workflow</text>
  <text class="eyebrow" x="720" y="448" text-anchor="start">PLATFORM · DEPLOY</text>
  <text class="detail" x="936" y="436" text-anchor="start">Denied approval: no deploy</text>
  <text class="eyebrow" x="88" y="496" text-anchor="start">05</text>
  <text class="label" x="88" y="520" text-anchor="start">Verify</text>
  <text class="detail" x="320" y="500" text-anchor="start">Telemetry alert</text>
  <text class="eyebrow" x="320" y="520" text-anchor="start">PLATFORM · RUN</text>
  <text class="detail" x="520" y="500" text-anchor="start">Journey check</text>
  <text class="eyebrow" x="520" y="520" text-anchor="start">HUMAN · AFTER ACTION</text>
  <text class="detail" x="720" y="500" text-anchor="start">Escalation owner</text>
  <text class="eyebrow" x="720" y="520" text-anchor="start">HUMAN · FAILURE</text>
  <text class="detail" x="936" y="508" text-anchor="start">Failed check: escalate</text>
  <text class="small" x="640" y="592">Illustrative control map · verify each control and exception path in the target environment</text>
</svg>

<!--
These controls solve different problems. An approval does not grant resource permission.
Review gates Azure infrastructure actions, not every connector write; other tools require their own policies or hooks.
Use scoped identities, branch and environment protections, audit trails, bounded actions, and a named escalation owner.
References: https://learn.microsoft.com/en-us/azure/sre-agent/run-modes, https://learn.microsoft.com/en-us/azure/sre-agent/github-connector, and https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure
-->

---

<!-- _class: ops-sources -->

## References

- [Azure SRE Agent: overview and run modes](https://learn.microsoft.com/en-us/azure/sre-agent/overview) · [approval boundaries](https://learn.microsoft.com/en-us/azure/sre-agent/run-modes)
- [GitHub connector](https://learn.microsoft.com/en-us/azure/sre-agent/github-connector) · [Copilot upgrade](https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-upgrade/overview)
- [Copilot modernization](https://learn.microsoft.com/en-us/azure/developer/github-copilot-app-modernization/overview) · [OIDC for Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure)
- [Original session](https://www.youtube.com/watch?v=DRV6mSEwg_g)

<!--
Documentation checked November 12, 2026.
-->
