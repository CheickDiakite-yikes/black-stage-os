# Live Local Harness Control Slice

Date: 2026-05-10

## Why this slice

The previous harness projection made background work visible, but it was still only part of the simulated approval continuation. The completion audit identified the next step: let the user start a local simulated harness run from the stage and keep that run inside the same event log and replay path.

## What changed

- Added a `Run harness` control to the visible labor panel when a thread exists and no run is active.
- Added a Stage Shell handler that starts a fresh local harness projection for the current thread.
- Made harness projection IDs configurable so repeated/local runs create distinct stage objects.
- Added a distinct `Live harness recorder` object for user-started harness runs.
- Extended e2e coverage to click `Run harness` and verify the live recorder appears.

## Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, including 2 voice-core and 4 agent-runtime subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 7 browser tests.

## Product insight

The stage starts to feel more like directing intelligence when background work can be summoned as a controlled local run, rather than only appearing as pre-scripted scenario animation.

## AI-building insight

Keeping this as a simulated local harness run preserves the approval/audit design while proving the UI route that live Codex or Agents SDK work can later occupy.
