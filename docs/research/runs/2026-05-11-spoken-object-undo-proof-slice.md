# Spoken Object Undo Proof Slice

Date: 2026-05-11

## What Was Attempted

Prove that the event-sourced object undo path works through the browser speech-recognition command route.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop by strengthening voice-native correction evidence without adding live Realtime provider calls.

## What Codex Did Well

- Extended the spoken correction browser test to issue `undo last object change`.
- Verified that a spoken rename can be reverted back to the previous object payload.
- Confirmed the undo is logged as a voice-origin `user.intervention`.

## What Failed Or Needed Human Intervention

No human intervention was needed. This remains a browser speech-recognition proof, not a live Realtime microphone session.

## Product Insight

Spoken undo makes the stage feel more like a responsive medium: the user can correct the workspace conversationally, not only through typed commands.

## AI-Building Insight

Voice features should reuse the same replayable command spine as text features until live Realtime sessions are deliberately armed.

## Evidence

- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "spoken correction"`
- `pnpm lint`
- `pnpm scan:secrets`
