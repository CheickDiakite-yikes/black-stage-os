# 2026-05-16 Render Zone Flow Slice

## Task

Continue the active Blackstage goal by improving the render field's organization
intelligence. The prior slice made the scene cinematic and mostly non-overlapping,
but Browser inspection still showed that approved scenes could read like a
collection of cards unless the field explained the spatial hierarchy.

## What changed

- Added `StageSceneZone` to `StageSceneManifest`.
- Added five active semantic zones: intent ingress, work focus, evidence orbit,
  approval threshold, and artifact output.
- Rendered zone bands and a soft zone-flow spine in `StageSceneField`.
- Retuned intent, primary-work, and artifact anchors after Browser found
  approved desktop overlap between secondary objects and the focal plan.
- Added e2e assertions for zone metadata, zone flow, post-approval object
  overlap, and command-dock clearance.

## Validation

- Browser desktop QA at the Build BlackStage hidden scenario:
  - 14 objects
  - 14 scene nodes
  - 11 scene edges
  - 5 scene zones
  - 5 active zones
  - zone flow visible
  - no object overlaps after approved full scene
  - no command dock overlaps
- `pnpm --filter @blackstage/stage-core typecheck` passed.
- `pnpm --filter @blackstage/stage-web typecheck` passed.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "streams intent"` passed.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm test:e2e` passed, 28/28.
- `pnpm scan:secrets` passed.

## Product insight

The field needs a visible grammar, not only better object coordinates. Users
should be able to feel "intent becomes work, work gathers evidence, evidence
feeds approval, approval produces artifact" from the geometry itself.

## AI-building insight

Browser geometry checks are better than visual vibes for this phase. The previous
slice had a clean story, but a wide viewport still exposed collisions. Treating
layout as a compiler output plus measured Browser evidence turns taste feedback
into reproducible engineering work.

## Remaining gap

The approval and artifact rail is still too side-panel shaped. A later slice
should make approval appear as a central threshold ritual while keeping the
right rail as an audit/control surface.
