# 2026-05-16 Approval Focus Pull Slice

## Task

Continue the rendering-first `/goal` by making pending approval feel attached to
the object/action being reviewed, rather than only appearing as a separate
threshold object.

## What Changed

- Derived one approval-focus object from the current `IntentThread` and
  `StageSceneManifest`.
- Marked the focused object with `data-approval-focus="true"` and kept it at
  full visual strength.
- Added a workspace pending-approval state that dims surrounding stage objects.
- Added an approval tether in `StageRitualField` from the focused object to the
  central approval threshold.
- Added e2e coverage for focus object selection, field dimming, tether presence,
  and threshold clearance.

## Validation

- Browser plugin QA for the hidden Build BlackStage pending state confirmed:
  - one approval button
  - one focused plan object
  - approval tether visible
  - intent object opacity dimmed to `0.44`
  - focused plan opacity at `1`
  - threshold does not overlap the plan or command dock
- `pnpm --filter @blackstage/stage-web typecheck` passed.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "streams intent"` passed.

## Product Insight

The approval moment reads better when the field behaves like a camera: one
object stays awake, the rest of the field recedes, and the approval question is
visibly tied to the object that would change.

## AI-Building Insight

Browser QA caught a cascade bug that e2e would have missed without an opacity
assertion: the object-emerge animation was overriding the intended dimming. The
test now checks the actual computed opacity for the pending approval state.

## Remaining Gap

The tether/focus state is still a DOM/SVG ritual, not a full focus-pull camera
move. The next slice should animate camera depth around the focused object and
make the threshold feel physically attached to the work surface.
