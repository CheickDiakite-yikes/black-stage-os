# Realtime Smoke Proof Index Slice

Date: 2026-05-11

## What Was Attempted

Expose redacted Realtime smoke proof summaries through the local Stage Broker so proof files under `.blackstage/realtime-smoke/` can become read-only evidence instead of invisible local artifacts.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop after adding redacted Realtime proof packets, and keep evidence visible without exposing secrets, approval phrases, or raw SDP.

## What Codex Did Well

- Added a broker-side proof index reader constrained to `.blackstage/`.
- Added `GET /api/blackstage/realtime/proofs` for sanitized summaries.
- Kept raw `requiredEnv`, error detail, raw SDP, provider credentials, and approval phrases out of the route response.
- Added a Stage Broker server test with a temporary ignored proof directory.

## What Failed Or Needed Human Intervention

No human intervention was needed. The route is read-only and does not arm or run a live Realtime session.

## Product Insight

Blackstage should make provider evidence inspectable as quiet proof, not as logs the user has to trust blindly. The broker proof index is a small step toward a visible live-voice audit lane.

## AI-Building Insight

Once live integrations exist, each proof artifact needs a sanitized read path. That lets tests and future UI surfaces verify evidence without granting the browser file-system or execution rights.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/stage-broker test`
- `pnpm test`
- `pnpm lint`
- `pnpm exec prettier --check apps/stage-broker/src/server.ts apps/stage-broker/src/realtimeSmokeProofs.ts apps/stage-broker/test/stageBrokerServer.test.mjs docs/23_realtime_live_smoke.md docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-realtime-smoke-proof-index-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
