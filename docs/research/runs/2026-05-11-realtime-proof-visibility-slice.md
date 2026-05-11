# Realtime Proof Visibility Slice

Date: 2026-05-11

## What Was Attempted

Make the Stage Web Realtime edge display the actual no-mic smoke proof boundary instead of a vague audio label.

## Prompt Given To Codex

Continue the active Blackstage goal loop in committed slices, keep live testing cheap, and make the startup and Realtime surfaces honest rather than demo-like.

## What Codex Did Well

- Preserved the `.blackstage/` proof boundary and exposed only sanitized proof metadata.
- Carried the cheap-guard offer shape into the broker proof summary.
- Updated the Stage Web Realtime status to show no mic send plus `recvonly` when that proof detail is available.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice stayed local and did not make another provider call.

## Product Insight

The proof surface should name the real safety contract. "No mic send" is clearer than "no audio" now that OpenAI requires a `recvonly` audio media section.

## AI-Building Insight

Realtime provider integration work needs UI-facing evidence that is precise but not secret-bearing. Summaries should preserve safety shape while dropping raw SDP, raw errors, and credentials.

## Evidence

- `apps/stage-broker/src/realtimeSmokeProofs.ts`
- `apps/stage-web/src/voice/realtimeBrokerReadiness.ts`
- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/tests/realtime-bridge.spec.ts`
