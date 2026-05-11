# Realtime Smoke Env Plan Slice

Date: 2026-05-11

## What Was Attempted

Add a local helper that prepares shell-only arming values for the live Realtime smoke without writing secrets, printing provider credentials, or making a network call.

## Prompt Given To Codex

Continue toward the Blackstage reality-interface goal after the Realtime proof-count slice, and make the missing live-smoke safety identifier and approval token easier to supply safely.

## What Codex Did Well

- Added `pnpm prepare:realtime-smoke`.
- Generated a stable hashed safety identifier without exposing the raw repo path.
- Generated a fresh local approval token and ignored `.blackstage/` proof path for the operator shell.
- Added script tests proving the helper is shell-only and does not render `OPENAI_API_KEY`.

## What Failed Or Needed Human Intervention

No human intervention was needed. The helper does not arm or run the live smoke by itself.

## Product Insight

The live voice path should feel explicitly armed, not magically enabled. A shell-only plan keeps the operator in control while reducing configuration friction.

## AI-Building Insight

When the next step needs secrets or paid API calls, Codex can still improve the path by generating non-secret arming material and tests, then stopping before the external call.

## Evidence

Validation for this slice should include:

- `pnpm test:scripts`
- `pnpm prepare:realtime-smoke`
- `pnpm exec prettier --check package.json scripts/prepare-realtime-smoke-env.mjs scripts/test/realtime-live-smoke-proof.test.mjs docs/23_realtime_live_smoke.md docs/research/runs/2026-05-11-realtime-smoke-env-plan-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
