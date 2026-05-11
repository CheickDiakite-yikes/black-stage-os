# Codex Runner Transport Slice

Date: 2026-05-11

## What Was Attempted

Make the localhost harness runner able to select the dry-run Codex App Server handoff transport with `BLACKSTAGE_CODEX_TRANSPORT=app_server`, while preserving CLI as the default and keeping live execution separately gated.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop after adding the core Codex App Server handoff contract.

## What Codex Did Well

- Added `codexTransport` to the browser-safe runner readiness payload.
- Kept live subprocess mode pinned to the CLI transport because App Server execution is not implemented.
- Added stage-runner proof that App Server transport produces a dry-run handoff event with `live_transport_armed: false`.

## What Failed Or Needed Human Intervention

The first runner test tried to enqueue a Codex task without an approved workspace. The test was corrected to provide a `.blackstage/workspaces/*` boundary, preserving the existing workspace guard.

## Product Insight

Transport selection should be visible as readiness metadata, not as a new panel. The user needs to know which worker edge is armed without seeing infrastructure replace the living stage.

## AI-Building Insight

Keeping App Server as a dry-run transport first lets Symphony-style orchestration become concrete without skipping the same workspace, approval, and proof expectations already attached to the CLI path.

## Evidence

- `pnpm --filter @blackstage/agent-runtime typecheck`
- `pnpm --filter @blackstage/agent-runtime build`
- `pnpm --filter @blackstage/stage-runner typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/agent-runtime test`
- `pnpm --filter @blackstage/stage-runner test`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/harness-policy.spec.ts`
