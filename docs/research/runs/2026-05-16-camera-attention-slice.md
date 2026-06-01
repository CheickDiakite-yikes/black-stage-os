# 2026-05-16 Camera Attention Slice

## Task

Continue the active rendering-first Blackstage goal by making the field's focus
state more legible. The prior slice attached pending approval to a work object,
but the field still needed a stronger camera vocabulary around that focal
object.

## What Changed

- Added an explicit camera aperture and focus corridor to `StageSceneField`.
- Exposed camera focus object, mode, depth, tilt, and parallax metadata on the
  scene field and workspace.
- Promoted pending approval focus into the camera focus target.
- Added object-level camera focus, distance, object id, and subtle parallax
  metadata to `StageObjectCard`.
- Shifted the pending approval threshold into the approval lane after Browser
  QA found it grazing the focused plan at the in-app viewport.
- Expanded e2e coverage for camera aperture/corridor, focus-object identity,
  object parallax metadata, and threshold clearance.

## Validation

- `pnpm --filter @blackstage/stage-web typecheck` passed.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "streams intent"` passed.
- Browser plugin QA at
  `http://127.0.0.1:5174/?stageScenario=build_blackstage&stageInstant=1&stageDelayMultiplier=0.02`
  confirmed:
  - page title `Black Stage OS`;
  - meaningful Stage Shell content rendered;
  - no framework overlay;
  - no relevant console warnings/errors;
  - camera aperture visible;
  - camera corridor visible;
  - plan object is the camera focus;
  - intent object has nonzero parallax metadata;
  - approval tether visible;
  - approval threshold no longer overlaps the plan;
  - command dock does not overlap the plan.
- Browser screenshot evidence:
  `/private/tmp/blackstage-camera-focus-qa-after.jpg`.

## Product Insight

The render field needs an attention system, not only object placement. The user
should be able to see what the system is thinking about before reading any
panel text. Aperture, corridor, dimming, tether, and parallax should converge on
one focal object.

## AI-Building Insight

The Browser plugin caught a viewport-specific overlap that the first targeted
e2e pass missed. This reinforces the current method: every visual slice needs
both DOM/geometry assertions and rendered Browser inspection.

## Remaining Gap

The threshold is still positioned with responsive CSS offsets. A stronger next
slice should compute threshold placement from measured object geometry or a
layout solver so approvals can negotiate space with the focal object instead of
using tuned breakpoints.
