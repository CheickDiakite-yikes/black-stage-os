# Spoken Harness Command Slice

Date: 2026-05-11

## What Was Attempted

Let text or voice intent start the existing local-only harness recorder through a deterministic Stage command.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop after making Realtime mic preflight visible, keeping the agentic harness tied to voice/text control without enabling live Codex or provider execution.

## What Codex Did Well

- Added a typed `run_harness` user-intervention command action.
- Routed `run harness` / `start harness` style commands into the existing local harness recorder.
- Kept the behavior local: simulated Stage events only, no live Codex subprocess, no App Server call, no Agents SDK call, and no external network.
- Added browser proof that spoken `run harness` creates the `Live harness recorder` and records a voice-mode command trace.

## What Failed Or Needed Human Intervention

No human intervention was needed. The command intentionally reuses the local harness fixture instead of starting live background workers.

## Product Insight

The harness should feel voice-native before it becomes live. A spoken command that opens visible labor on the stage is closer to Blackstage than a hidden background job button.

## AI-Building Insight

Voice-to-harness control needs deterministic command layers before model-backed interpretation. This keeps the boundary auditable while the live worker path remains gated.

## Evidence

- `pnpm --filter @blackstage/stage-core typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "local harness from a spoken command"`
- `pnpm --filter @blackstage/stage-web build`
- `pnpm exec prettier --check packages/stage-core/src/events/stageEvent.ts apps/stage-web/src/app/App.tsx apps/stage-web/tests/stage-shell.spec.ts docs/21_agentic_harness_architecture.md docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-spoken-harness-command-slice.md`
