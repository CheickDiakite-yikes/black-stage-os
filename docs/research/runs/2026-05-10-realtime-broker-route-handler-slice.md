# Realtime Broker Route Handler Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop toward a real Blackstage voice edge without leaking keys, bypassing approvals, or making unapproved network calls.

## What Was Attempted

- Added a framework-neutral Realtime WebRTC broker route handler in `voice-core`.
- Accepted only `POST` requests to `/api/blackstage/realtime/session` with `application/sdp` bodies.
- Kept the route disabled by default.
- Blocked live route handling unless live mode, server API key presence, server safety identifier, configured-live session mode, and browser SDP are all present.
- Required an injected OpenAI exchange function before any live SDP exchange can happen.
- Redacted response headers so authorization material cannot come back to the browser.

## What Codex Did Well

- Turned the trusted-server plan into a testable route-shaped contract without adding a framework or real network dependency.
- Proved disabled and invalid route paths do not call the injected network exchange.
- Proved the enabled path returns only SDP and does not expose the test API key or authorization header in the route response.

## What Needed Correction

- The slice was kept framework-neutral because the repo does not yet have a dedicated backend app. The next step is to mount this handler behind a local server entrypoint.

## Product Insight

The voice edge should enter Blackstage as a controlled doorway, not as a provider SDK sprayed into the client. A boring route contract is what lets the front-of-house experience stay cinematic and calm.

## AI-Building Insight

Testing "no network unless injected" is as important as testing the happy path. It lets the repo carry live-provider architecture safely before credentials or side effects exist.

## Evidence

- `pnpm --filter @blackstage/voice-core test`: passed with 14 voice-core subtests.
- Full repo validation is required before commit.
