# Stage Harness Fixtures Slice

Date: 2026-05-10

## Why this slice

The local harness scheduler existed, but its work was still invisible to the Stage Shell. The product goal requires background labor to be visible, auditable, interruptible, and replayable. This slice projects local harness proof into the same stage event stream as the rest of Stage Shell v0.

## What changed

- Added a harness-to-stage projection layer in `packages/agent-runtime`.
- Added a deterministic Build BlackStage harness snapshot containing:
  - one simulated background Codex run;
  - one approval-blocked workspace write;
  - one completed artifact packet;
  - one replayable failure packet.
- Projected that snapshot into:
  - a `timeline` stage object;
  - a `research_note` proof packet;
  - visible `agent.progress` events.
- Appended the harness projection after the Build BlackStage approval continuation.
- Added agent-runtime coverage for the projection.
- Added e2e assertions that the Stage Shell visibly renders the harness recorder and failure event.

## Validation

- `pnpm --filter @blackstage/agent-runtime typecheck`: passed.
- `pnpm --filter @blackstage/agent-runtime test`: passed with 4 Node subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, including 2 voice-core and 4 agent-runtime subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 7 browser tests.

## Product insight

The background harness should read like a stage-visible black box recorder, not like a separate dashboard. Users should see enough proof to trust the work without being asked to supervise every internal state transition.

## AI-building insight

Projecting local scheduler state into existing stage events lets simulated, Codex, Agents SDK, and Realtime work share the same audit/replay spine later.
