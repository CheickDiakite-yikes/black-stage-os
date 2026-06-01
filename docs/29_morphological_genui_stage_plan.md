# 29 Morphological GenUI Stage Plan

## Purpose

This plan preserves the product direction clarified by Cheick's 10-second
voice-enabled demo in `/Users/cheickdiakite/Downloads/jgsx_f_ce_erbyq_z_sz_rmp_.mp4`.

The target is not a nicer dashboard and not a replacement set of cards.
Blackstage should behave like a living render field where a central nucleus
listens, gathers context, digests it, changes mode, allocates generated space,
streams structure into that space, and only then reveals a dense workbench.

## Direction To Preserve

Streaming GenUI in Blackstage means stage-owned morphology:

1. **Nucleus**: the black void remains dominant; one central living object
   signals presence, listening, and readiness.
2. **Orbit**: topic objects appear around the nucleus as temporary contextual
   matter, not as permanent dashboard cards.
3. **Collapse**: context visibly compresses back into the nucleus before the
   system answers or generates.
4. **Mode shift**: color, geometry, and field texture change when the task type
   changes.
5. **Socketing**: empty generated regions appear before they fill, so users see
   the workspace being allocated.
6. **Patch growth**: content streams into sockets through validated patches.
7. **Workbench reveal**: dense tools can appear, but only after the user sees
   the field earn that density.
8. **Inspect fallback**: cards and panels are allowed as inspect mode, not as
   the default visual language.

## Attribution And Source Notes

- Product direction and reference demo: Cheick Diakite.
- Engineering analysis and implementation partner: Codex.
- Strategy, critique, architecture, and documentation partner: GPT-5.5 Pro
  when used in the broader product workflow.
- External research reference: `json-render` by Vercel Labs is useful for
  schema, catalog, validation, and patch-stream mechanics. Blackstage should
  not copy its conventional dashboard visual output.
- Any external demo, paper, library, or product studied during the next slices
  must be named in the relevant research log with source URL, access date, and
  what was borrowed at the contract level.

## Git Discipline

Every step below should end with a small commit and push when it changes the
repo. Keep commits attributed to Cheick's configured Git identity:

```bash
git config user.name
git config user.email
git add <focused files>
git commit -m "<slice summary>"
git push
```

Current local attribution checked on 2026-06-01:

- `user.name`: `Cheick Diakite`
- `user.email`: `112525078+CheickDiakite-yikes@users.noreply.github.com`

Do not include unrelated local images, temp screenshots, secrets, generated
model dumps, or private audio/video files in commits unless Cheick explicitly
asks.

## Next 20 Steps

### 1. Direction Lock

**Hypothesis:** future work improves if the team has a durable morphology brief
instead of relying on chat memory.

**Deliverable:** this document, a research log for the demo study, and a small
memory note.

**Evidence:** docs are committed and pushed; future Codex threads can cite this
file before touching stage rendering.

### 2. Frame Study Archive

**Hypothesis:** the demo's timing is as important as its final look.

**Deliverable:** a lightweight, repo-safe frame-study note with selected frame
descriptions, not the private source video unless approved.

**Evidence:** a timeline that marks nucleus, orbit, collapse, mode shift,
socketing, patch growth, and workbench reveal with timestamps.

### 3. Research Refresh

**Hypothesis:** the best near-term GenUI path is a hybrid of JSON-render-style
contracts, AG-UI/A2UI-like event protocols, and Blackstage's existing intent
thread/event spine.

**Deliverable:** a research brief comparing contract patterns, streaming
semantics, safety boundaries, and visual implications.

**Evidence:** cited sources, prompt-injection notes, and a clear "borrow / do
not borrow" table.

### 4. Morphology Event Taxonomy

**Hypothesis:** streaming UI will stay coherent if phases are explicit events,
not CSS-only animation states.

**Deliverable:** event names for `nucleus_awake`, `context_orbit_started`,
`context_collapsed`, `mode_shifted`, `sockets_allocated`, `patch_applied`, and
`workbench_revealed`.

**Evidence:** stage-core types or docs define phase order, timestamps, replay
behavior, and policy boundaries.

### 5. Stage Morph Frame Contract

**Hypothesis:** the renderer needs a contract above raw React and below natural
language.

**Deliverable:** `StageMorphFrame` or equivalent schema with phase, nucleus,
orbit objects, sockets, patches, camera, voice envelope, and approvals.

**Evidence:** fixtures validate with tests; unsafe arbitrary DOM/code cannot be
emitted by model output.

### 6. Deterministic Fixture Scenarios

**Hypothesis:** we can make the UI feel generated without live model variance
by replaying deterministic patch timelines first.

**Deliverable:** three fixture conversations: planning task, code task, and
approval-gated artifact task.

**Evidence:** each fixture replays the same phase sequence on desktop and
phone.

### 7. Nucleus Renderer Slice

**Hypothesis:** a strong central nucleus can make even an empty stage feel
alive, intentional, and voice-native.

**Deliverable:** an idle and active nucleus renderer with breathing, listening,
thinking, and generating states.

**Evidence:** screenshots show no busy chrome in first viewport; reduced-motion
mode remains calm and legible.

### 8. Voice Envelope Bridge

**Hypothesis:** voice feels native when audio energy affects the nucleus and
field in real time.

**Deliverable:** local voice envelope signal from available Web Speech,
Realtime, or microphone amplitude paths, with simulation fallback.

**Evidence:** waveform-like energy visibly maps to nucleus pulses without
needing a transcript.

### 9. Orbit Context Renderer

**Hypothesis:** rectangular information can feel stage-native if it first
appears as orbiting context matter around a central object.

**Deliverable:** temporary orbit objects with semantic roles, glints, edges,
and timed arrival.

**Evidence:** first viewport still reads as black field plus generated context,
not dashboard.

### 10. Collapse And Digest Transition

**Hypothesis:** the missing move between "context" and "answer" is visible
digestion.

**Deliverable:** context objects compress into the nucleus before the system
allocates output space.

**Evidence:** tests or replay snapshots verify the collapse phase occurs before
sockets or workbench surfaces appear.

### 11. Mode Shift System

**Hypothesis:** users understand task changes faster when color and geometry
change by semantic mode.

**Deliverable:** mode tokens for planning, coding, research, approval,
artifact, and memory.

**Evidence:** mode shifts are visible but restrained; the palette avoids
generic purple-dashboard dominance.

### 12. Socket Allocator

**Hypothesis:** empty sockets make generated UI feel constructed rather than
teleported.

**Deliverable:** a socket layout allocator that creates placeholders for
future generated surfaces before content arrives.

**Evidence:** generated surfaces have stable positions and do not cause layout
jump on laptop or phone.

### 13. Patch Growth Renderer

**Hypothesis:** users trust generated UI more when they can see validated
patches fill stable sockets over time.

**Deliverable:** patch application renderer with block-level arrival, status,
and replayable patch trail.

**Evidence:** screenshots and e2e tests show ordered patch growth, no overlap,
and clear pending/resolved states.

### 14. Workbench Reveal

**Hypothesis:** dense UI is acceptable only after it has emerged from the field.

**Deliverable:** a final generated workbench state with perspective, code/data
or artifact surfaces, central graph, and quiet telemetry.

**Evidence:** final state can be dense, but the transition makes it feel earned
rather than dumped.

### 15. Inspect Mode

**Hypothesis:** cards are still useful for audit, but harmful as the main
experience.

**Deliverable:** an explicit inspect mode that reveals raw event, patch, and
artifact cards behind a command, gesture, or debug affordance.

**Evidence:** normal user flow does not show static card walls; QA/debug flow
can still inspect state.

### 16. Approval Ritual Integration

**Hypothesis:** approval should interrupt the field as a central ritual object,
not a side panel.

**Deliverable:** approval gate rendered as a phase-aware object with risk,
action, consequence, and explicit approve/decline controls.

**Evidence:** high-impact actions remain blocked until approval; approval is
visible, auditable, and hard to miss.

### 17. Instrumentation

**Hypothesis:** the right metrics are phase, interruption, density, and trust
signals, not generic page events.

**Deliverable:** telemetry for phase duration, time to first object, patch
count, approval latency, interrupt events, and inspect-mode usage.

**Evidence:** local event export shows the morphology lifecycle for each demo
run.

### 18. Hypothesis Testing Loop

**Hypothesis:** we will know if this works by watching whether people describe
the interface as alive, generated, calm, and controllable.

**Deliverable:** a lightweight test script for Cheick review, internal review,
and naive-user review.

**Evidence:** observations captured in research logs, with concrete design
changes attached to each finding.

### 19. Browser And Device Validation

**Hypothesis:** the concept only works if laptop and phone both preserve the
same black-field hierarchy.

**Deliverable:** Playwright/browser checks for desktop and phone viewports,
including screenshots for idle, orbit, collapse, socketing, patch growth, and
workbench states.

**Evidence:** screenshots show no overlapping text, no clipped controls, and no
busy first viewport.

### 20. Demo Harness And PR Narrative

**Hypothesis:** the fastest way to align product, engineering, and research is
a deterministic demo harness with a crisp narrative.

**Deliverable:** a one-command local demo, exported evidence, research log, and
PR summary explaining what changed and why.

**Evidence:** `pnpm` validation passes, screenshots/video are reviewed, and the
branch is pushed with focused commits.

## Research Questions To Keep Open

1. How much density can appear before the stage stops feeling calm?
2. Which objects deserve orbit treatment versus immediate workbench treatment?
3. What is the minimum voice envelope signal needed to make the system feel
   voice-native?
4. Can collapse/digest be fast enough to preserve flow while still feeling
   meaningful?
5. Should mode shifts be automatic from intent classification or explicitly
   visible as agent reasoning?
6. What should be replayable for audit: raw patches, rendered frames, voice
   envelope, or all three?
7. How do we prevent generated workbenches from becoming generic enterprise
   dashboards?

## Non-Goals

- Do not clone the visual demo literally.
- Do not ship a card wall with better animations.
- Do not let model output create arbitrary DOM or untrusted actions.
- Do not hide approval or agent labor behind decorative motion.
- Do not optimize for feature count before proving the stage morphology.
