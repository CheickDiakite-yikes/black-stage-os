# Realtime Smoke Proof Slice

Date: 2026-05-11

## What Was Attempted

Add a redacted proof-file option for the live Realtime smoke path so an armed `gpt-realtime-2` SDP exchange can leave local evidence without committing secrets, approval phrases, raw SDP, or browser traces.

## Prompt Given To Codex

Continue the `/goal` loop after the founder suggested leveraging OpenAI Realtime voice 2 as part of the background harness, while keeping provider calls approval-gated and auditable.

## What Codex Did Well

- Kept live OpenAI network calls disabled because the safety identifier and local approval token were unset.
- Added an optional `.blackstage/` proof writer for `pnpm smoke:realtime`.
- Added script-level tests for proof redaction, path confinement, env readiness, and raw SDP omission.
- Updated the live smoke runbook and completion audit.

## What Failed Or Needed Human Intervention

No human intervention was needed. The armed live smoke itself remains blocked until the operator supplies the safety identifier and local approval token from a controlled shell.

## Product Insight

Realtime voice should produce the same kind of evidence as the rest of Blackstage: calm proof, not hidden provider plumbing. A redacted proof packet prepares the path for live voice without making the stage depend on secret-bearing logs.

## AI-Building Insight

Integration smoke tests need a proof artifact before they need more live calls. The artifact shape lets future runs be audited without requiring Codex to see secrets or raw protocol payloads.

## Evidence

Validation for this slice should include:

- `pnpm test:scripts`
- `BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH=.blackstage/realtime-smoke/skip-proof.json pnpm smoke:realtime`
- `pnpm preflight:realtime`
- `pnpm exec prettier --check package.json scripts/smoke-realtime-live.mjs scripts/realtime-live-smoke-proof.mjs scripts/test/realtime-live-smoke-proof.test.mjs docs/23_realtime_live_smoke.md docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-realtime-smoke-proof-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
