# Agent Interruptibility Slice

Date: 2026-05-10

## Objective Gap

The reality-interface goal says agent work must be visible, auditable, and interruptible. Before this slice, Stage Shell showed agent labor but did not let the user stop pending work once a simulated run had started.

## Slice Implemented

- Added `thread.status_updated` stage events for explicit thread status changes.
- Added a `Stop` control to the visible agent labor panel while work is running.
- Stopping work now:
  - cancels pending simulated runtime timers;
  - preserves un-emitted runtime events for resume;
  - marks the thread `paused`;
  - emits a `user.intervention` event with `interventionType: "stop"`;
  - keeps already-emitted agent labor visible for audit.
- Added a `Resume` control that continues preserved simulated work.
- Added e2e coverage proving stop prevents the later approval request from appearing until resume continues the preserved event queue.

## Boundary

This is a stop/resume path for the simulated runtime. It does not yet implement durable cross-reload pause checkpoints, partial task editing, or real external tool cancellation.

## Product Insight

Interruptibility needs to be a visible stage affordance, not a hidden keyboard shortcut. The user should feel able to stop the system, inspect the trace, and continue from a preserved queue when ready.

## Validation Notes

Full gate after implementation:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed; package tests are still placeholder echoes except e2e.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with six tests, including the new stop/interruptibility test.
- `pnpm scan:secrets`: passed; no high-confidence secrets found across 107 tracked files.
