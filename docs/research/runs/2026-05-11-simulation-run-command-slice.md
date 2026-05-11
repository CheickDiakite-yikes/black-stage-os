# Simulation Run Command Slice

Date: 2026-05-11

## What Was Attempted

Make the simulation card respond to a bounded local run command while keeping real simulation engines out of scope.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop by making one more render object controllable, auditable, and replayable without granting live external execution.

## What Codex Did Well

- Added a `simulate ...` / `run simulation ...` command.
- Updated the simulation card title, status, and steps as local stage state.
- Recorded the command through `user.intervention` and `object.updated` evidence.
- Added browser proof that the run stays local and does not call an external engine.

## What Failed Or Needed Human Intervention

No human intervention was needed. No external simulation engine, model call, or network request was added.

## Product Insight

A local run command makes the simulation object feel more like a stage instrument and less like static explanatory copy.

## AI-Building Insight

Representing requested simulations locally gives future live engines a clean approval boundary: the stage can first show the requested scenario, then later ask before running a real backend.

## Evidence

- `pnpm --filter @blackstage/stage-core typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "simulation scenarios"`
- `pnpm lint`
- `pnpm scan:secrets`
