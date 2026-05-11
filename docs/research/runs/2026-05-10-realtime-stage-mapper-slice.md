# Realtime Stage Mapper Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop and keep the OpenAI Realtime voice path aligned with the Blackstage thesis: voice can be live, but it must still become ordinary Stage events, approvals, and replayable evidence.

## What Was Attempted

- Added a Realtime-to-Stage mapper in `voice-core`.
- Mapped final voice transcripts into `intent.submitted` events with `inputMode: "voice"`.
- Mapped assistant speech into `assistant.speech` events.
- Dropped partial assistant deltas from durable Stage storage to avoid noisy traces.
- Mapped Realtime tool-call requests into explicit `approval.requested` events with a new `tool_call` approval action type.
- Mapped Realtime errors into failed agent-progress events.

## What Codex Did Well

- Kept live voice from becoming a second, invisible conversation channel.
- Preserved the approval spine for model-requested tools.
- Added focused unit coverage before touching any browser or network code.

## What Needed Correction

- `voice-core` needed an explicit workspace dependency on `stage-core`, so `pnpm install` was run to refresh the local workspace link.

## Product Insight

Realtime voice should feel native, but its durable footprint should be the same as text: intent, agent labor, approval, artifact, and replay. That keeps the black field trustworthy instead of merely conversational.

## AI-Building Insight

Tool calls should enter the product as approval requests, not as provider-native side effects. This gives Blackstage one policy surface across Realtime, Agents SDK, Codex, and future external integrations.

## Evidence

- `pnpm --filter @blackstage/voice-core test`: passed with 10 voice-core subtests.
- Full repo validation is required before commit.
