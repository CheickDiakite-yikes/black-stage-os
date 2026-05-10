# Natural Stage Commands Slice

Date: 2026-05-10

## Objective Gap

The reality-interface goal requires the user to manipulate outputs through speech, text, gesture, and correction. Before this slice, text and voice could start a scenario, and buttons could manipulate objects, but command-like utterances such as "collapse the spec portal" still restarted the run instead of shaping the current stage.

## Slice Implemented

- Added a small stage-command parser for active threads.
- Supported `focus`, `pin`, `unpin`, `collapse`/`hide`, and `expand`/`show`/`open` commands.
- Matched commands to object titles, types, and aliases such as `plan`, `spec portal`, `document`, and `validation browser`.
- Routed successful commands through `user.intervention` plus `object.updated` events, so manipulation remains auditable.
- Extended research events with optional redacted command text and command action.
- Extended e2e coverage so the command bar collapses and reopens the spec portal before the rest of the approval/artifact flow continues.

## Boundary

This is not a full natural-language command model. It is a deterministic v0 control layer for high-confidence stage-object commands, shared by typed input and the existing voice submission path.

## Product Insight

The command bar becomes more powerful when it edits the current intent world instead of only creating a new one. Even a tiny deterministic command layer makes the stage feel more interruptible and directed.

## Validation Notes

Full gate after implementation:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed; package tests are still placeholder echoes except e2e.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with three tests. The full artifact/export path now has a 120s budget because it exercises streamed events, object manipulation, approvals, artifact editing, downloads, and screenshot capture in one cinematic flow.
- `pnpm scan:secrets`: passed; no high-confidence secrets found across 107 tracked files.
