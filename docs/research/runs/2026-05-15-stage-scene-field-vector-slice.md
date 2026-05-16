# Stage Scene Field Vector Slice

Date: 2026-05-15

## What Was Attempted

Move the cinematic render system from an internal scene-manifest contract into
the visible Stage Web surface. The target was to make semantic relationships
visible as a living vector field behind the readable object surfaces.

## Prompt Given To Codex

Continue the active Blackstage goal and make concrete progress toward a calm,
dark, cinematic living render field where intent dynamically forms organized
documents, models, approvals, visible labor, and artifacts.

## What Codex Did Well

- Added `StageSceneField` as a manifest-driven SVG/CSS layer.
- Rendered scene clusters as halos for intent, primary work, evidence,
  approvals, artifacts, and telemetry.
- Rendered scene edges as luminous paths for `frames`, `supports`,
  `requests_approval`, and `produces` relationships.
- Moved object placement from CSS grid coincidence into semantic stage-space
  coordinates supplied by `StageSceneManifest`.
- Added a focal floor/horizon system so the primary work object feels anchored
  to a stage.
- Kept the layer non-interactive so readable DOM surfaces and approval controls
  remain accessible above it.
- Extended the Stage Shell e2e evidence to assert that the field contains
  scene nodes, relationship edges, and cluster halos.
- Converted the object-card transform back to 2D hit-testable transforms while
  preserving depth through scale, halos, scene vectors, and stage floor cues.
- Stabilized the active command dock so hover/focus no longer shifts the Speak
  button away from the pointer target.
- Made the artifact workbench choose the newest artifact by artifact timestamp
  so late old draft events cannot reclaim the active workbench surface.

## What Failed Or Needed Human Intervention

The first browser pass showed object overlap at the current in-app browser
viewport. The fix was to tighten stage coordinates, bound supporting evidence
island sizes, and add a hidden `stageInstant=1` visual-QA deep link so active
states can be validated without reintroducing visible demo buttons.

The first interaction pass showed two renderer-specific failures: 3D card
transforms could desynchronize child button hit boxes, and hover-expanded
command controls could move the Speak target during click. Both were treated as
rendering bugs, not test problems.

The remaining renderer gap is still material and motion quality: the field is
now organized, but approval and agent labor still need to become central
cinematic objects rather than mostly side-rail panels.

## Product Insight

The active stage becomes more legible when the field itself explains why
objects exist: intent frames the primary display, evidence supports it,
approvals gate action, and artifacts are produced from the work.

## AI-Building Insight

A scene manifest is not enough. The renderer needs direct evidence that
manifest relationships are visible on screen, otherwise organization
intelligence can silently remain a model-layer abstraction.

## Evidence

- `apps/stage-web/src/components/StageSceneField.tsx`
- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/src/styles/global.css`
- `apps/stage-web/tests/stage-shell.spec.ts`
- `docs/28_cinematic_rendering_system.md`

## Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed, 28/28.
- `pnpm scan:secrets`: passed, no high-confidence secrets found.
- Browser desktop QA at
  `?stageScenario=build_blackstage&stageInstant=1&stageDelayMultiplier=0.02`:
  initial state had 3 visible render objects, 3 scene nodes, 2 scene edges, no
  object overlaps, and no command-dock overlaps.
- Browser approved-state QA at the same URL: 14 visible render objects, 14 scene
  nodes, 11 scene edges, dense constellation mode active, approved artifact
  workbench visible, Speak hit target remained the button, and no object or
  command-dock overlaps above the QA threshold.
