# Realtime Broker Approval Readiness Slice

Date: 2026-05-11

## Why this slice

Stage Web could hold a local approval phrase, but it could not tell whether the live broker itself had been armed with a matching approval gate. That made the UI capable of offering `Arm live` even when the server would only reject the SDP POST.

## Prompt

Continue the active Blackstage goal loop and keep the live Realtime edge honest about which safety gates are actually configured.

## What changed

- Added `liveApprovalRequired` and `liveApprovalConfigured` to Realtime broker readiness contracts.
- Exposed those fields from `apps/stage-broker`.
- Made Stage Web show `live locked` until the live broker reports its approval gate is configured.
- Made Stage Web require both server-side approval configuration and the local approval phrase before enabling `Arm live`.
- Covered the broker readiness contract in server tests and the Stage Web bridge fixture.

## Validation

- `pnpm build`: passed across the sorted workspace.
- `pnpm typecheck`: passed across 8 of 9 workspace projects.
- `pnpm lint`: passed.
- `pnpm test`: passed with 23 `voice-core` subtests, 4 `memory-core` subtests, 15 `agent-runtime` subtests, 9 `stage-broker` subtests, and 13 `stage-runner` subtests.
- `pnpm --filter @blackstage/voice-core test`: passed with 23 Realtime subtests.
- `pnpm --filter @blackstage/stage-broker test`: passed with 9 broker subtests.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-web test:e2e -- tests/realtime-bridge.spec.ts`: passed with one browser test.
- `pnpm smoke:realtime`: passed in default skip-gated mode; no live OpenAI call was made.
- `pnpm exec prettier --check ...`: passed for the touched files.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 203 tracked files after staging.

## Product insight

The stage should not invite the operator to arm a live edge that is impossible to use. Readiness now distinguishes "broker is live" from "broker is live and approval-armed."

## AI-building insight

Provider-facing readiness should report capability and safety-gate state separately. That keeps local UI decisions auditable without revealing secrets.
