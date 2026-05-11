# Realtime Cheap Arming Plan Slice

Date: 2026-05-11

## What Was Attempted

Make the Realtime live-smoke arming plan itself carry the cheap-test constraints before any paid provider call is run.

## Prompt Given To Codex

Continue the active Blackstage goal loop after the local `.env.local` safety work, and keep OpenAI Realtime testing cheap and explicitly armed.

## What Codex Did Well

- Added cheap-test metadata to the generated Realtime smoke env plan.
- Made `pnpm prepare:realtime-smoke` print the 15-second timeout request alongside the proof path and approval values.
- Reused the same timeout cap constant in the live smoke script so the plan and runner stay aligned.
- Extended script tests to assert the no-audio, shell-armed, timeout-capped plan.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live OpenAI call was run.

## Product Insight

The eventual live voice test should feel like a staged approval ritual, not a hidden provider call. The arming packet should tell the operator what will and will not happen.

## AI-Building Insight

Operator helpers are part of the safety boundary. Encoding cheap-test constraints in the generated plan reduces drift between docs, tests, and live scripts.

## Evidence

- `scripts/prepare-realtime-smoke-env.mjs`
- `scripts/smoke-realtime-live.mjs`
- `scripts/test/realtime-live-smoke-proof.test.mjs`
- `docs/23_realtime_live_smoke.md`
