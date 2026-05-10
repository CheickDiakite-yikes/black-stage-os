# Local Harness Contracts Slice

Date: 2026-05-10

## Why this slice

The harness architecture decision needs a safe first implementation step before any live OpenAI API, Codex subprocess, or external tracker integration. The right first move is local contracts plus a deterministic scheduler that can be tested without network access.

## What changed

- Added harness task, run, event, adapter, and scheduler snapshot types to `packages/agent-runtime`.
- Added a simulated harness adapter for local proof-of-work events.
- Added an in-memory scheduler with:
  - queued task execution;
  - approval-required blocking before adapter execution;
  - dependency ordering;
  - local workspace metadata in events.
- Exported the harness contracts from `@blackstage/agent-runtime`.
- Replaced the placeholder agent-runtime test command with a Node test that runs against the built package.

## Validation

- `pnpm --filter @blackstage/agent-runtime typecheck`: passed.
- `pnpm --filter @blackstage/agent-runtime test`: passed with 3 Node subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, including 3 harness subtests.
- `pnpm build`: passed.
- `pnpm scan:secrets`: passed.

## Product insight

The harness should become visible through stage events, not through a separate task dashboard. Even the scheduler's internal state should be shaped as proof that can appear calmly on the black field.

## AI-building insight

Starting with a simulated adapter keeps the orchestration contract honest: approval and dependency semantics can be tested before live Codex, Agents SDK, or Realtime wiring adds cost and failure modes.
