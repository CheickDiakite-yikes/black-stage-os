# Realtime Live Smoke Command Slice

Date: 2026-05-11

## Why this slice

The stage now has visible Realtime arming, but the repo needed a safe operator command for the first real OpenAI Realtime SDP smoke. The command must be runnable without accidentally spending API calls or leaking secrets.

## Prompt

Continue the active Blackstage goal loop and move the Realtime bridge toward a real live smoke while keeping high-impact OpenAI network calls explicitly armed.

## What changed

- Added `pnpm smoke:realtime`.
- Added `scripts/smoke-realtime-live.mjs`.
- Made live execution require `BLACKSTAGE_REALTIME_LIVE_SMOKE=1`.
- Required server-side OpenAI key, safety identifier, and broker approval phrase before a live call.
- Generated a browser WebRTC data-channel offer through headless Chromium.
- Sent no microphone/audio track and printed only safe proof metadata.
- Added `docs/23_realtime_live_smoke.md`.

## Validation

- `pnpm smoke:realtime`: passed in default skip-gated mode with no OpenAI network call.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 202 tracked files.

## Product insight

The live voice edge now has an operator runbook, not just hidden code. That keeps Blackstage's trust model intact as it approaches real provider traffic.

## AI-building insight

Skip-gated live smoke commands let the repo accumulate real integration paths without forcing every validation run to depend on secrets, paid APIs, or network availability.
