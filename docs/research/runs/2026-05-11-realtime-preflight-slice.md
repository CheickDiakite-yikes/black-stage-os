# Realtime Preflight Slice

Date: 2026-05-11

## What Was Attempted

Add a redacted operator preflight for the live Realtime smoke path so Blackstage can tell whether `gpt-realtime-2` live smoke is armed without exposing secrets or making a provider call.

## Prompt Given To Codex

Continue the `/goal` loop after discussing OpenAI Realtime voice 2 and the background agentic harness.

## What Codex Did Well

- Checked the current env without printing secret values.
- Preserved the skip-gated live smoke behavior.
- Added `pnpm preflight:realtime` for redacted set/unset readiness.
- Updated the live smoke runbook and skip message to point operators at the preflight.

## What Failed Or Needed Human Intervention

No human intervention was needed. The actual live smoke remains unarmed because the live flag, safety identifier, and local approval token are unset.

## Product Insight

The voice edge needs a ritual before it goes live. A redacted preflight makes the boundary feel intentional instead of mysterious.

## AI-Building Insight

One-off env checks are easy to get subtly wrong. Encoding the preflight as a command reduces operator drift before live provider tests.

## Evidence

Validation for this slice should include:

- `pnpm preflight:realtime`
- `pnpm smoke:realtime`
- `pnpm exec prettier --check package.json scripts/preflight-realtime-live.mjs scripts/smoke-realtime-live.mjs docs/23_realtime_live_smoke.md docs/research/runs/2026-05-11-realtime-preflight-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
