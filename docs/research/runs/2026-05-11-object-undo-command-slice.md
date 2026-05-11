# Object Undo Command Slice

Date: 2026-05-11

## What Was Attempted

Add a bounded correction path that can undo the latest stage-object update using the existing event log.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop by improving correction and manipulation without hiding state outside the replayable stage event stream.

## What Codex Did Well

- Added `undo last object change` as an event-history based revert.
- Replayed the previous `object.created` or `object.updated` payload instead of mutating hidden UI state.
- Recorded the undo as a `user.intervention` with `interventionType: undo`.
- Added browser proof that a rename can be undone back to the previous object title.

## What Failed Or Needed Human Intervention

No human intervention was needed. The first implementation stayed local and replayable; it does not attempt broad multi-step history management yet.

## Product Insight

Undo makes the stage feel more governable. The user can shape the workspace and recover from a local edit without trusting invisible state.

## AI-Building Insight

Event-sourced undo is a better fit for Blackstage than ephemeral component history because it keeps correction auditable and replay-compatible.

## Evidence

- `pnpm --filter @blackstage/stage-core typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "undo the last object change"`
- `pnpm lint`
- `pnpm scan:secrets`
