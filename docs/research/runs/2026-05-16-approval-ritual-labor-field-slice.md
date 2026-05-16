# 2026-05-16 Approval Ritual Labor Field Slice

## Task

Continue the active rendering-first `/goal` by making approval and visible agent
labor part of the Blackstage field itself, not only right-rail panels.

## What Changed

- Added `StageRitualField`, a central non-interactive layer above
  `StageSceneField`.
- Rendered recent agent events as a geometric labor orbit in the stage field.
- Rendered the latest approval as a compact approval threshold in the field.
- Kept the right-rail `ApprovalCard` as the only explicit approve/reject/ask-why
  control surface.
- Added e2e geometry checks for pending and approved threshold states.
- Tightened the harness action e2e test so approval is clicked through the
  scoped approval card and proven resolved before preparing a packet.
- Updated the architecture doc, cinematic renderer doc, goal checkpoint, and
  tracker workbook.

## Validation

- Browser plugin QA at
  `http://127.0.0.1:5174/?stageScenario=build_blackstage&stageInstant=1&stageDelayMultiplier=0.02`
  confirmed one approve button, central ritual present, central threshold
  present, 4 visible labor nodes in pending state, and no threshold overlap with
  the plan object or command dock.
- `pnpm --filter @blackstage/stage-web typecheck` passed.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "streams intent"` passed.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "prepares approved artifacts"` passed.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm test:e2e` passed, 28/28.
- `pnpm scan:secrets` passed.
- `git diff --check` passed.

## Product Insight

Approval and labor need to appear as spatial field events. A user should not
have to read a sidebar to understand that work is happening or that the system
has reached a high-impact threshold.

## AI-Building Insight

Rendering feedback becomes actionable when translated into geometry checks:
button counts, ritual presence, labor-node counts, and overlap gates. That gives
the cinematic critique a reproducible engineering handle.

## Remaining Gap

The approval threshold is now in the field, but it is still symbolic. The next
slice should make the relevant work object become the approval instrument by
dimming the field, focusing the camera, and binding the approval to the exact
object/action being reviewed.
