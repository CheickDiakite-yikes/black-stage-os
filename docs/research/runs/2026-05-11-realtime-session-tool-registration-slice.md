# Realtime Session Tool Registration Slice

Date: 2026-05-11

## What Was Attempted

Make the first human live voice session capable of naturally calling the safe
Blackstage tool, not only the synthetic no-mic tool probe.

## Prompt Given To Codex

Continue toward the active Blackstage goal after the live voice arming helper.
Focus on whether live interaction can actually do tool/function calling and
render useful work.

## What Codex Did Well

- Added a Realtime `session.update` client event that registers the safe
  `blackstage_prepare_external_action` function when the data channel opens.
- Kept the tool narrow: it prepares local approval-gated action packets and
  never executes external side effects.
- Reused the same schema for the forced tool probe and the session-level tool.
- Extended browser proof to verify the session tool registration, approval card,
  local tool execution, returned function output, and redacted debug evidence.

## What Failed Or Needed Human Intervention

No human intervention was needed. The next validation still needs a human
microphone session to confirm the model calls the registered tool naturally.

## Product Insight

The first live magic test should not depend on a hidden synthetic prompt. The
session itself should know the one safe thing it can ask the stage to prepare.

## AI-Building Insight

Session-level tool registration is the right bridge between toy probes and a
real agentic runtime. It keeps the live model capable while the Stage approval
layer remains the execution boundary.

## Evidence

- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
- `docs/23_realtime_live_smoke.md`
- `docs/27_live_voice_test_protocol.md`
