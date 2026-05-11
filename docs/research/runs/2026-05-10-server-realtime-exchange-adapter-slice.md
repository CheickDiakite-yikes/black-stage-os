# Server Realtime Exchange Adapter Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop by giving the local broker a real server-side OpenAI Realtime exchange adapter while keeping live calls disabled unless the broker is explicitly configured and receives a browser SDP offer.

## What Was Attempted

- Added `createOpenAiRealtimeExchange` in `apps/stage-broker`.
- Mapped trusted-server broker requests to `https://api.openai.com/v1/realtime/calls`.
- Sent SDP and session config as multipart form data from the server side only.
- Kept the standard API key and safety identifier on the server side.
- Added safe failure handling so provider errors do not leak internal details back to the browser.

## What Codex Did Well

- Moved from pure contract to a real provider adapter without changing the default local demo path.
- Kept provider exchange behind the existing route gate: no live network call happens unless live mode, server key, safety identifier, SDP body, and route handler are all present.
- Added injected-fetch tests instead of making a live OpenAI call during validation.

## What Needed Correction

- ESLint needed the test file to declare the Node `Response` global.
- The route handler needed safe catch behavior around exchange failures.

## Product Insight

The Realtime bridge can now be wired in sequence: Stage sees broker readiness, browser creates an SDP offer only after explicit enablement, the server exchanges with OpenAI, and resulting voice/tool events remain Stage-owned.

## AI-Building Insight

Provider adapters should be verified with injected transport first. It proves request shape, redaction, and failure behavior without burning live API calls or hiding errors behind environment differences.

## Evidence

- `pnpm --filter @blackstage/voice-core test`: passed with 21 Realtime subtests.
- `pnpm --filter @blackstage/stage-broker test`: passed with 7 local server/exchange subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed with 21 `voice-core`, 4 `memory-core`, 13 `agent-runtime`, and 7 `stage-broker` subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 177 tracked files after final staging.
