# Realtime Instruction Contract Slice

Date: 2026-05-11

## What Was Attempted

Add a Blackstage-owned instruction contract for the `gpt-realtime-2` voice edge before enabling any default live audio path.

## Prompt Given To Codex

Continue the `/goal` loop and account for the founder's suggestion to leverage OpenAI Realtime voice 2 as part of the background agentic harness.

## What Codex Did Well

- Turned the voice model choice into a typed instruction contract rather than leaving it as a loose string.
- Preserved sparse, calm speech as the default voice behavior.
- Kept tool calls, browsing, file writes, publishing, spending, and memory access behind Stage approval events.
- Kept the instruction version in the local contract for auditability; later live-smoke work removed unsupported provider-side `session.metadata`.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice did not start a microphone stream or call OpenAI.

## Product Insight

The voice edge should feel native and alive, but the product trust comes from keeping the stage as the source of approvals, artifacts, and audit traces.

## AI-Building Insight

Provider-specific voice capability should be wrapped in a repo-owned behavioral contract before live sessions, so future model swaps preserve product taste and safety posture.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/voice-core typecheck`
- `pnpm --filter @blackstage/voice-core test`
- `pnpm exec prettier --check packages/voice-core/src/realtime/realtimeVoiceSession.ts packages/voice-core/src/realtime/realtimeVoiceServerBroker.ts packages/voice-core/test/realtimeVoiceSession.test.mjs docs/21_agentic_harness_architecture.md docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-realtime-instruction-contract-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
