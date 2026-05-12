# Realtime Tool Argument Rendering Slice

Date: 2026-05-11

## What Was Attempted

Make approved Realtime tool execution render the model's actual tool arguments
as meaningful stage work instead of only showing a generic proof object.

## Prompt Given To Codex

Continue toward the active Blackstage goal after proving session-level tool
registration. Focus on making live tool/function calling actually do useful,
visible work.

## What Codex Did Well

- Parsed the safe tool's `action` and `reason` arguments after Stage approval.
- Added those fields to the local action packet, review artifact, and returned
  `function_call_output`.
- Kept raw provider arguments out of artifact storage.
- Extended the Realtime browser proof to assert the returned function output and
  artifact contain the requested action.

## What Failed Or Needed Human Intervention

No human intervention was needed. The next open question is whether the live mic
session produces action/reason arguments that feel specific and useful.

## Product Insight

The first live tool result must look like the stage understood the request, not
like a generic adapter fired. Rendering the model's structured intent makes the
tool card feel like actual work.

## AI-Building Insight

Function-calling proof is stronger when the argument payload becomes a typed,
visible artifact. This creates a clearer audit path while preserving the
approval boundary.

## Evidence

- `apps/stage-web/src/voice/realtimeToolExecution.ts`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
- `docs/23_realtime_live_smoke.md`
- `docs/27_live_voice_test_protocol.md`
