# 28 Cinematic Rendering System

## Purpose

The attached demo video reframes the rendering goal. Blackstage is not a card
grid with dark styling. It needs a living scene system where intent becomes a
spatial, fluid, inspectable field of work.

The nearest useful prior art is `vercel-labs/json-render`, but the target is
different:

- `json-render` turns guarded JSON specs into conventional UI trees.
- Blackstage must turn guarded intent-thread state into a cinematic scene graph.

The useful idea to borrow is not dashboard components. It is the contract:
cataloged renderable primitives, schema-constrained generation, progressive
patches, actions, state bindings, validation, and devtools.

Source studied: https://github.com/vercel-labs/json-render at
`0bbe6ed6394b23b5aee25320d03c9b7ac717e5b7`.

## What The Demo Teaches

The video expresses several product truths:

1. The black field is a material, not a background.
2. Objects feel like luminous islands sitting inside the material.
3. The camera has depth, tilt, and focus pull.
4. Objects materialize progressively instead of appearing as static cards.
5. Charts, documents, approvals, and activity surfaces share a field, but each
   has a distinct material language.
6. The bottom activity rail reads as quiet machine telemetry, not navigation.
7. The user should feel like they are directing a private cognitive apparatus.

The current Stage Shell has the correct event and safety spine, but the render
layer still treats objects too much like arranged panels. The next render system
must make organization intelligence visible through motion, hierarchy, depth,
and material.

## Reference Video 2 Frame Read

Source: `/Users/cheickdiakite/Downloads/Create_a_cinematic_futuristic (1).mp4`.
Observed at 1280x720, 24fps, 8 seconds.

Granular read:

1. `00:00-00:02` starts as an almost empty black field. The interaction affordance
   is one central orb plus a small instruction. The field is already alive:
   constellation lines, orbit rings, fine grain, and soft star nodes imply depth
   before any app UI exists.
2. `00:02-00:03` materializes one dominant document artifact from the field. The
   artifact is not a card in a grid; it is a lit object sitting on a reflective
   stage with surrounding agent telemetry.
3. `00:03-00:04` grows supporting instruments around the dominant object: map,
   lists, charts, radial gauges, and tables. The intelligence is organized by
   focal hierarchy, not equal-sized panels.
4. `00:04-00:05` focus pulls into the central analytical surface. Background
   instruments remain visible but subordinate, and the stage floor ring anchors
   the user’s eye.
5. `00:05-00:06` a high-impact action interrupts the analysis as an approval
   ritual. The rest of the field dims behind it. The question sits above the
   object; the object becomes the action.
6. `00:06-00:08` the action object resolves into a geometric labor field:
   pyramids, crystals, orbits, progress dots, and small agent labels. This is the
   key lesson: completion should become a visible work state, not a toast or a
   sidebar.

Engineering implications:

- The renderer needs one focal object at a time.
- The field needs stage coordinates, depth, floor rings, and relationship paths.
- Supporting objects should orbit the focal object instead of stacking in rows.
- Approval should dim the field and become a central ritual object.
- Agent labor needs a geometric/telemetry form, not only feed rows.
- Browser visual QA must compare screenshots against this reference vocabulary,
  not merely check that elements exist.

## Architecture

### 1. Source Of Truth: Intent Thread

The durable source remains `IntentThread` plus Stage events:

- intent
- render objects
- agent events
- approvals
- artifacts
- memory and research notes

No renderer should invent state that cannot be replayed or audited.

### 2. Scene Manifest Compiler

`IntentThread` compiles into `StageSceneManifest`.

The manifest assigns:

- ambient state: idle, thinking, working, approval needed, artifact ready
- layout mode: empty field, intent thread, focused workbench, approval gate
- camera state: depth, tilt, parallax, focal object
- substrate state: black velvet/glass, liquidity, bloom, grain
- node roles: intent anchor, primary display, evidence, approval, artifact
- material cues: black glass, luminous document, data glass, approval light
- edges: frames, supports, requests approval, produces

This is our equivalent of a `json-render` spec, but specific to a reality
interface.

### 3. Render Catalog

Blackstage should expose a guarded catalog of stage primitives:

- `IntentAnchor`
- `PrimaryDisplay`
- `DocumentIsland`
- `DataInstrument`
- `ApprovalGate`
- `ArtifactWorkbench`
- `AgentTelemetry`
- `MemoryGlow`
- `SceneEdge`
- `LiquidSubstrate`

The agent can request objects from this catalog. It cannot emit arbitrary DOM or
unchecked code.

### 4. Patch Stream

Borrow the `json-render` patch-stream principle:

```jsonl
{"op":"add","path":"/nodes/0","value":{"role":"intent_anchor"}}
{"op":"add","path":"/nodes/1","value":{"role":"primary_display"}}
{"op":"replace","path":"/camera/focalObjectId","value":"plan_1"}
```

For Blackstage, patch streams should update the scene manifest, not raw React
components. This lets voice, tools, and agents progressively assemble the field
while the UI stays safe and replayable.

### 5. Renderer Layers

The renderer should be layered:

1. WebGL or canvas substrate: black liquid, bloom, grain, parallax.
2. SVG/vector field: edges, contours, glow paths, focus rings.
3. DOM object surfaces: readable documents, charts, controls, approvals.
4. Telemetry rail: visible labor, latency, tool calls, approvals.
5. Debug overlay: manifest, patches, event log, timing.

This lets us get cinematic motion without sacrificing text clarity or approval
accessibility.

### 6. Layout Intelligence

Layout should be semantic before geometric.

The compiler should decide:

- which object is primary
- which objects support it
- which action requires approval
- which artifact is forming
- what is pinned, collapsed, or focus-pulled

Only after those decisions should it choose coordinates, depth, scale, and
motion. This avoids the current failure mode where the field can look organized
spatially but not intellectually.

## Implementation Phases

### Phase 0: Contract

Status: started.

- Add `StageSceneManifest` to `stage-core`.
- Compile `IntentThread` to scene roles, clusters, materials, phases, edges,
  substrate, and camera state.
- Expose scene roles and materials to Stage Web as data attributes and classes.

### Phase 1: Fluid DOM/SVG Renderer

Status: started.

- Replace rectangular-card dominance with scene-role surfaces.
- Add SVG contour/edge layer generated from manifest edges.
- Add material-specific object skins.
- Add focus-pull transitions when the primary object changes.
- Keep readable DOM surfaces for documents and approvals.

Current implementation:

- `StageSceneField` renders a vector layer from `StageSceneManifest`.
- Manifest edges become luminous SVG paths such as `frames`, `supports`,
  `requests_approval`, and `produces`.
- Manifest transforms now carry semantic stage-space `x`, `y`, `z`, `scale`,
  and tilt values so object placement comes from the scene compiler instead of
  CSS grid coincidence.
- Manifest clusters become halos for intent, primary work, evidence, approval,
  artifact, and telemetry.
- Manifest zones now define the larger spatial grammar of the field: intent
  ingress, work focus, evidence orbit, approval threshold, and artifact output.
  `StageSceneField` renders those zones as faint active bands plus a flow spine
  so organization is visible before a user reads any card.
- `StageSceneField` renders a focal floor/horizon system under the primary
  object, giving the field a stage, not just a background.
- DOM objects remain the readable/control-bearing surfaces above the field, but
  they are positioned as luminous islands around the focal work object.
- Stage object cards intentionally use 2D hit-testable transforms for the
  control-bearing DOM surface. Depth is carried by manifest scale, halo,
  vector-field geometry, floor rings, and material treatment rather than by
  browser 3D transforms that can misalign child controls.
- In active mode, the command dock keeps stable geometry. Secondary controls
  stay quiet instead of expanding the dock on hover, so Speak remains a reliable
  click target while the field is animating.
- Artifact workbench focus is sorted by artifact timestamps, not event arrival
  order, so late old draft events cannot pull focus away from a newer approved
  artifact.
- The approved desktop scene now has an e2e geometry gate for all visible
  objects and the command dock, preventing secondary work/task objects from
  drifting back across the focal plan card.
- `StageRitualField` now renders a central, non-interactive ritual layer above
  the scene field and below the control-bearing DOM surfaces. It turns recent
  agent events into a quiet geometric labor orbit and mirrors the latest
  approval as an approval threshold inside the field.
- The right rail still owns the explicit approval buttons and audit copy. The
  central threshold is visual/spatial intelligence, not a second control
  surface, so high-impact actions remain accessible and unambiguous.
- Browser geometry QA now checks that pending and approved approval-threshold
  states do not cover the focal plan object or the command dock, and that the
  approved scene keeps object, command, and threshold collisions at zero.
- Pending approvals now create an approval-focus state: the relevant work object
  stays at full strength, surrounding objects dim, and `StageRitualField` draws
  a live tether from the object to the approval threshold. This starts turning
  approval into a camera/focus event instead of a detached badge.

### Phase 2: Liquid Substrate

- Add a dedicated substrate component behind objects.
- Start with CSS/SVG procedural layers.
- Move to WebGL/Three only when the field needs real parallax, bloom, and shader
  motion.
- Keep a reduced-motion mode that renders a stable, non-blank field.

### Phase 3: Streaming Scene Patches

- Add a `stage.render.patch` event family.
- Apply JSON Patch compatible updates to the scene manifest.
- Record every patch in the research/debug log.
- Show patch latency in live debug mode.

### Phase 4: Generative Render Guardrails

- Build the stage component catalog and prompt contract.
- Allow the agent runtime to request scene changes through the catalog.
- Reject unknown object types, unsafe actions, and unapproved external effects.
- Keep high-impact actions behind visible approval gates.

## Engineering Rules

1. Never let aesthetics bypass replayability.
2. Never let generated UI bypass the catalog.
3. Do not add arbitrary app chrome to solve organization problems.
4. Layout intelligence belongs in the compiler, not scattered CSS selectors.
5. The renderer should feel fluid, but the state model must stay precise.
6. Manual visual QA should use the Browser plugin; automated behavior remains in
   the Playwright e2e suite.

## Local Visual QA Entrypoints

The product should not show demo scenario buttons in the startup UI. For repeat
visual QA, Stage Web supports hidden query parameters:

- `?stageScenario=build_blackstage` starts a known scenario without visible demo
  chrome.
- `?stageIntent=<text>` starts a freeform intent.
- `?stageInstant=1` applies the scenario event stream immediately for cheap
  screenshot checks.
- `?stageDelayMultiplier=0.02` keeps the timed stream but accelerates it for
  local testing.

These are QA/deep-link controls, not user-facing navigation. They exist so
Browser validation can repeatedly inspect active render fields while the real
startup experience remains the empty orb field.

Latest Browser-plugin QA for the Build BlackStage scenario:

- Initial state: 3 objects, 3 scene nodes, 2 scene edges, no object overlaps,
  no command-dock overlaps, Speak hit target resolves to the button.
- Pending approval state: one approval button remains in the right-rail control
  surface, the central approval threshold is visible in the field, 4 labor
  nodes are visible, the plan card is the single approval-focus object,
  surrounding intent/evidence objects dim, an approval tether is visible, and
  the threshold does not cover the focal plan or command dock.
- Approved state: 14 objects, 14 scene nodes, 11 scene edges, dense
  constellation mode active, approved artifact workbench visible, no object
  overlaps, no command-dock overlaps, no approval-threshold/object overlaps,
  Speak hit target still resolves to the button.

## Next Slice

Make the vector field more alive without sacrificing readability:

- Add focus-pull transitions when the primary object changes.
- Make the approval instrument more cinematic: the tethered work object should
  receive a stronger focus pull, the rest of the field should fall further into
  black material, and the threshold should feel physically attached to the
  object it is asking about.
- Evolve the current labor orbit into a richer geometric/progress constellation
  that can expand into the full audit feed.
- Capture real object geometry after layout and map SVG edges to actual object
  centers instead of semantic approximations.
- Add a compact manifest/debug overlay for live sessions.
- Add Browser-plugin screenshots against idle, compact active, and full desktop
  active states.
