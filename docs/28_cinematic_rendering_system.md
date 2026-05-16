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

- Replace rectangular-card dominance with scene-role surfaces.
- Add SVG contour/edge layer generated from manifest edges.
- Add material-specific object skins.
- Add focus-pull transitions when the primary object changes.
- Keep readable DOM surfaces for documents and approvals.

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

## Next Slice

Build the Phase 1 SVG/vector field:

- `StageSceneField` component in Stage Web.
- Use manifest nodes and edges to draw luminous relations.
- Make primary/supporting/approval/artifact clusters visibly connected.
- Add Browser-plugin screenshots to compare against the video contact sheet.
