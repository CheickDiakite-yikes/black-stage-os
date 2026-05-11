# Codex App Server Handoff Slice

Date: 2026-05-11

## What Was Attempted

Move the background harness one step closer to Symphony-scale Codex orchestration by adding a typed Codex App Server handoff contract while keeping all live execution disabled by default.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop after the founder suggested leveraging open-source Codex, OpenAI Symphony orchestration, and the newer Realtime voice path for the background harness.

## What Codex Did Well

- Added a Blackstage-owned App Server handoff protocol instead of calling a live Codex process.
- Kept browser mutation, provider credential exposure, push, and live transport arming explicitly false in the handoff packet.
- Updated the workflow policy and Stage Web harness line so the operator can see that the coding worker path now supports Codex CLI and App Server transports.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live App Server, Codex subprocess, OpenAI network call, or external action was attempted.

## Product Insight

Codex App Server belongs behind the same quiet `Harness edge` as the CLI path. The user should see proof that the system can route work to real workers without watching infrastructure sprawl across the stage.

## AI-Building Insight

The right intermediate artifact is a handoff packet, not a direct live run. It lets Symphony-style orchestration evolve toward programmatic Codex without weakening approval gates or hiding execution boundaries.

## Evidence

- `pnpm --filter @blackstage/agent-runtime typecheck`
- `pnpm check:workflow`
- `pnpm --filter @blackstage/agent-runtime test`
- `pnpm --filter @blackstage/stage-runner test`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/harness-policy.spec.ts`
