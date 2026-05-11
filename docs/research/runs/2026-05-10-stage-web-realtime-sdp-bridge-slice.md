# Stage Web Realtime SDP Bridge Slice

Date: 2026-05-10

## Why this slice

Stage Web could see whether the local Realtime broker was mounted, but it did not invoke the browser SDP bridge. This slice adds the first explicit Stage Web bridge from the living field to the broker while keeping simulation as the default.

## Prompt

Continue the active Blackstage goal loop by turning the existing OpenAI Realtime v2 contracts into a browser-visible, approval-safe bridge.

## What changed

- Added a Stage Web Realtime WebRTC bridge guarded by `VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED=1` or explicit local runtime config.
- Kept browser exchange SDP-only: no standard API key exposure and no microphone/audio stream in this slice.
- Added Realtime server-event parsing for final transcripts, assistant text/audio transcript events, content-part completion, tool calls, and errors.
- Wired Realtime data-channel messages into the existing Stage event mapper.
- Added a Playwright proof that a mocked live broker receives the SDP offer and Stage Web records a `Realtime SDP bridge connected` agent event.
- Fixed a React development StrictMode race so a cancelled readiness effect cannot mark the bridge as already started.

## Validation

- `pnpm --filter @blackstage/voice-core test`: passed with 23 Realtime subtests.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-web test:e2e -- tests/realtime-bridge.spec.ts`: passed with mocked broker and peer connection.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 10 browser tests.
- `pnpm scan:secrets`: passed across 197 tracked files after final staging.

## Product insight

The stage can show `live SDP` as a quiet status without turning the interface into provider plumbing. The user still sees a calm edge signal, while the event log captures the technical proof.

## AI-building insight

The bridge needed a cancellation-safe arming flag because React dev-mode effect replay can otherwise mark a live connection as started before the replacement effect is allowed to connect.
