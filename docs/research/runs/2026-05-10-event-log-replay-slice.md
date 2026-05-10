# Event Log Replay Slice

Date: 2026-05-10

## Why this slice

The Stage Shell v0 spec and backlog call for replayable, serializable intent threads. Before this slice, the prototype saved current thread state and redacted research events, but it did not preserve the raw local stage-event log needed to replay how the workspace formed over time.

## What changed

- Added `stageEvents` to the local Stage Shell session snapshot.
- Stored local `StageEvent` entries alongside redacted `ResearchEvent` entries.
- Included stage events in session JSON export.
- Added a calm replay control to the research trace panel.
- Replayed stage events into the render field without appending duplicate events to the log.
- Added e2e coverage proving replay reconstructs the stage and keeps the event count stable.

## Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:e2e`: passed with 7 tests.

## Product insight

Replay makes the interface feel more auditable without adding dashboard chrome. The research trace can become a quiet black-box recorder for how intent became a workspace.

## AI-building insight

The longer browser suite surfaced timing brittleness in the existing stop test. Tightening that test improved the confidence signal without changing product behavior.
