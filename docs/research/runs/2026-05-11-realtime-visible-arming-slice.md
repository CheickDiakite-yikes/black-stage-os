# Realtime Visible Arming Slice

Date: 2026-05-11

## Why this slice

The broker and browser bridge now require a local approval phrase, but the Stage Web experience still needed a human-visible arming moment. A live Realtime session should feel intentionally opened by the operator, not silently triggered by runtime config.

## Prompt

Continue the active Blackstage goal loop and make the Realtime approval phrase visible as an operator-owned stage action while keeping simulation as the default.

## What changed

- Added a Stage Web `Arm live` control that appears only when a live broker is reachable.
- Routed the arming click through the existing approval card before any SDP POST occurs.
- Started the SDP bridge only after the Realtime approval is approved.
- Kept the local approval phrase out of the rendered UI while still sending it in the broker approval header after approval.
- Updated the Realtime bridge e2e proof so it asserts no SDP POST happens before visible approval.

## Validation

- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-web test:e2e -- tests/realtime-bridge.spec.ts`: passed with one browser test.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 10 browser tests using one Playwright worker.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 199 tracked files.

## Product insight

The live edge now has a ritual shape: broker presence, arm request, approval card, then visible bridge activity. That is closer to Blackstage's trust model than a hidden "connected" state.

## AI-building insight

The same approval surface can gate local memory, live Codex runs, and live Realtime exchange without creating a separate settings dashboard. The stage itself remains the control plane.
