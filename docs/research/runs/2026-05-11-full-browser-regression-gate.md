# Full Browser Regression Gate

Date: 2026-05-11

## What Was Attempted

Run the full Stage Web browser regression suite after the image context, memory recall/review, and spoken artifact revision slices.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop and avoid repeating completed work. Choose the next concrete action toward the objective.

## What Codex Did Well

- Chose a full browser gate after several focused UI/event slices.
- Found a suite-order timing bug in the cross-thread memory review test.
- Stabilized the test by waiting for the seed-round scenario approval before issuing the second memory write.
- Reran the full suite and refreshed the tracked Stage Shell screenshot evidence.

## What Failed Or Needed Human Intervention

The first full browser run failed because the memory test tried to assert the second memory approval while the seed-round scenario approval was still becoming the latest approval card. No human intervention was needed; the test now waits for the scenario approval boundary.

## Product Insight

The full suite matters because Stage Shell behavior is event-timed. Focused tests can pass while suite-order timing still reveals whether the stage stays coherent as multiple intent threads and approvals move through it.

## AI-Building Insight

After several small slices, a browser regression gate is not ceremony. It catches interaction timing that unit and focused tests miss.

## Evidence

- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "memory writes"`: passed.
- `pnpm test:e2e`: passed with 15 browser tests.
- `artifacts/screenshots/stage-shell-v0.png` refreshed by the full Stage Shell flow.
