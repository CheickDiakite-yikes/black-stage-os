# Stage Web Realtime Proof Count Slice

Date: 2026-05-11

## What Was Attempted

Make Stage Web read the local broker's redacted Realtime smoke proof index and show a compact proof count in the `Realtime edge` status.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop after adding broker-side Realtime proof summaries, and keep live voice evidence visible without turning the stage into provider plumbing.

## What Codex Did Well

- Added a browser-safe Realtime proof client.
- Kept proof reads credential-free and read-only.
- Updated the calm `Realtime edge` line to include proof count only when the broker returns sanitized proof summaries.
- Extended the focused Realtime bridge Playwright test to mock proof summaries and assert the visible proof count.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice does not arm or run a live OpenAI Realtime session.

## Product Insight

Proof count is enough for the first visual evidence signal. The user sees that Realtime evidence exists without reading transport logs or seeing a task dashboard.

## AI-Building Insight

Provider proof surfaces should move through the same path as harness evidence: server-side sanitization first, then a small browser-readable summary, then optional richer inspection later.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/realtime-bridge.spec.ts`
- `pnpm lint`
- `pnpm exec prettier --check apps/stage-web/src/voice/realtimeBrokerReadiness.ts apps/stage-web/src/app/App.tsx apps/stage-web/src/components/StageShell.tsx apps/stage-web/tests/realtime-bridge.spec.ts docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-stage-web-realtime-proof-count-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
