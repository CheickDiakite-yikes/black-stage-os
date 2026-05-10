# Agentic Harness Stack Decision

Date: 2026-05-10

## What was attempted

Cheick suggested that the background agentic harness should leverage open-source Codex, OpenAI's Symphony orchestration work, and the newer OpenAI Realtime voice stack.

## What changed

- Verified the current official OpenAI surfaces before hard-coding the direction.
- Added `docs/21_agentic_harness_architecture.md` as the repo-backed architecture note.
- Added `assistant.speech` as a stage event schema anchor for future realtime voice output.
- Added `assistant_speech` research event mapping with redacted speech text.
- Fixed the stop/resume e2e timing path so resumed delayed events are not scaled twice.

## Product insight

The right split is not "Stage Shell does everything." Stage Shell should remain the living control surface, while a separate harness performs long-running work and streams auditable events back to the stage.

## AI-building insight

Symphony is most useful as an orchestration pattern: task state, bounded concurrency, isolated workspaces, retries, and human review. The first Blackstage implementation should start with an internal queue before adopting external trackers.

## Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm scan:secrets`: passed.
- `pnpm test:e2e`: passed with 7 tests.
