# Realtime Approved Tool Execution Slice

Date: 2026-05-11

## What Was Attempted

Move Realtime function calling beyond approval rendering by executing one safe
local tool after explicit approval.

## Prompt Given To Codex

Continue the Blackstage goal after the founder said live interaction needs to
actually do tool/function calling and that rendering quality remains important.

## What Codex Did Well

- Preserved Realtime call IDs and tool names as structured approval metadata.
- Added a safe local adapter for `blackstage.prepare_external_action`.
- Made approval resolve into visible stage work: a focused tool-result object,
  a review artifact, and agent labor events.
- Returned `function_call_output` to the live Realtime data channel when a
  writable channel exists.
- Preserved the Realtime final transcript as an `intent.submitted` stage event
  before the new intent thread objects stream in.
- Kept the tool result local-only with `externalSideEffects: false`.

## What Failed Or Needed Human Intervention

The first typecheck caught narrowing issues around optional tool-call metadata.
The full browser bridge suite also exposed that the visible Realtime transcript
was starting a thread without seeding the durable stage-event log with
`intent.submitted`; that is now fixed. No product-direction intervention was
needed.

## Product Insight

Tool calls feel real only when approval changes the stage. The right first proof
is not an external side effect; it is a visible local function result that can
be returned to the model and audited by the user.

## AI-Building Insight

The data channel is now not just an event listener. It is a bidirectional tool
surface with a redacted local trace, which gives future live voice tests useful
debug evidence without exposing raw provider payloads.

## Evidence

- `packages/stage-core/src/domain/ApprovalRequest.ts`
- `packages/voice-core/src/realtime/realtimeVoiceEvent.ts`
- `packages/voice-core/src/realtime/realtimeVoiceStageMapper.ts`
- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `apps/stage-web/src/voice/realtimeToolExecution.ts`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
- `pnpm --filter @blackstage/voice-core test`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/realtime-bridge.spec.ts`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm scan:secrets`
- `pnpm exec prettier --check ...`
- `git diff --check`
