# Codex Run Proof Slice

Date: 2026-05-10

## Why this slice

Workspace manifests establish the intent and policy before a runner task starts. The missing half was post-run proof: a durable local record that a task completed, failed, blocked, or was cancelled with enough metadata for later review.

## Prompt

Continue the active Blackstage goal after preparing bounded Codex workspaces. Move the harness toward auditable visible labor without enabling live Codex by default.

## What changed

- Added `blackstage-run.json` proof packet writing for prepared Stage Runner tasks.
- Captures run id, task id, adapter, status, summary, started/completed timestamps, event count, and policy.
- Keeps `externalActionTaken: false` explicit in local proof.
- Returns the proof path from `POST /api/blackstage/harness/run-next`.
- Extended temp-directory tests to verify both task manifest and run proof files.

## Validation

- `pnpm --filter @blackstage/stage-runner typecheck`: passed.
- `pnpm --filter @blackstage/stage-runner test`: passed with 11 subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: not rerun for this server-only proof-packet slice; the Stage Web surface did not change after the previous e2e pass.

## Product insight

The harness should leave artifacts of labor, not just state transitions. Even dry-run work should have a proof packet because Blackstage is meant to be auditable by design.

## AI-building insight

Proof packets turn local orchestration into evidence. This gives future UI replay and human review a durable source independent of the in-memory queue.
