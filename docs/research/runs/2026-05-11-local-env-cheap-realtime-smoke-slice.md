# Local Env Cheap Realtime Smoke Slice

Date: 2026-05-11

## What Was Attempted

Let local Realtime smoke tooling safely use a developer-owned `.env` file while keeping live testing cheap, redacted, and explicitly armed.

## Prompt Given To Codex

Continue toward the active Blackstage goal after the founder added a local `.env` with an OpenAI API key, and make sure testing uses the key carefully and cheaply.

## What Codex Did Well

- Verified `.env` and `.env.local` are ignored by git before relying on them.
- Added a tiny local env loader that records only env var names, never secret values.
- Wired Realtime preflight, prepare, and smoke scripts to load `.env` or `.env.local` locally.
- Kept live Realtime smoke skipped unless `BLACKSTAGE_REALTIME_LIVE_SMOKE=1` and the safety identifier plus local approval token are also set.
- Added a cheap-test guard: SDP-only smoke keeps the microphone track disabled and caps live smoke timeout.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live OpenAI Realtime smoke was run in this slice, and no local env contents were printed or committed.

## Product Insight

Local-first live testing should feel deliberate. A founder can keep a key in `.env` or `.env.local`, but Blackstage should still require explicit arming and show redacted readiness before any network call.

## AI-Building Insight

Secret usability and secret safety should not fight each other. Loading `.env` into process memory while only emitting set/unset and key names gives future agents enough context to operate without exposing credential values.

## Evidence

- `.gitignore`
- `scripts/local-env.mjs`
- `scripts/preflight-realtime-live.mjs`
- `scripts/prepare-realtime-smoke-env.mjs`
- `scripts/smoke-realtime-live.mjs`
- `scripts/test/realtime-live-smoke-proof.test.mjs`
