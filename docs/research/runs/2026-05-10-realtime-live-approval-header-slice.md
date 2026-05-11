# Realtime Live Approval Header Slice

Date: 2026-05-10

## Why this slice

After Stage Web gained an explicit SDP bridge, the broker still needed a second live-exchange arming layer. A live env flag, API key, and safety identifier should not be enough to open a Realtime session unless a local caller also sends an explicit approval phrase.

## Prompt

Continue the active Blackstage goal loop and keep the OpenAI Realtime bridge aligned with the product rule that high-impact live actions require human approval.

## What changed

- Added `BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN` for the local broker.
- Added `x-blackstage-realtime-approval` as the required live-mode SDP approval header.
- Blocked live broker POSTs with `403` before any OpenAI exchange when the approval phrase is absent or mismatched.
- Let Stage Web send the approval header only from explicit local runtime/env config.
- Extended the Realtime bridge e2e proof to assert that the local approval header is sent with the SDP offer.

## Validation

- `pnpm --filter @blackstage/stage-broker test`: passed with 8 broker subtests.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-web test:e2e -- tests/realtime-bridge.spec.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 10 browser tests.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 198 tracked files.

## Product insight

This keeps live voice feeling intentionally armed rather than ambiently available. The user should experience live mode as a deliberate opening of the stage edge, not as a hidden background side effect.

## AI-building insight

The same pattern now protects both live Codex and live Realtime: env flag, bounded route, proof/readiness, and a local approval phrase before execution or exchange.
