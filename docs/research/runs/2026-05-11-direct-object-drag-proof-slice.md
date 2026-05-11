# Direct Object Drag Proof Slice

Date: 2026-05-11

## What Was Attempted

Close the Stage Shell v0 proof gap around direct manipulation by adding a browser test for pointer dragging a render object and verifying the movement enters the research trace.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop and choose the next uncovered requirement after the Codex App Server handoff checkpoint.

## What Codex Did Well

- Found that the nudge and drag controls already existed instead of adding new UI.
- Added focused browser coverage for pointer dragging the plan object.
- Verified both visible position change and replayable `render_object_updated` research metadata.

## What Failed Or Needed Human Intervention

The first assertion assumed zero initial x-offset. The existing fixture already places the plan object with an offset, so the test was corrected to assert a drag delta and final logged position.

## Product Insight

Direct manipulation is useful only if it becomes part of the stage record. A gesture that changes the living field should be replayable, not just visually satisfying.

## AI-Building Insight

Browser proof is better than code inspection for this slice. Pointer capture, layout transforms, and local trace persistence interact in ways that static review can easily over-trust.

## Evidence

- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "direct object dragging"`
