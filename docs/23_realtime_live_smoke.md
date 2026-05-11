# 23 Realtime Live Smoke

Status: Local operator runbook
Date: 2026-05-11

## Purpose

`pnpm smoke:realtime` is the first repo-backed path for proving the local Realtime broker against a real OpenAI Realtime SDP exchange. It is skip-gated by default and does not call OpenAI unless the operator explicitly arms it.

Local `.env` and `.env.local` files are supported for credentials such as `OPENAI_API_KEY`, but they do not arm the paid live path by themselves. `BLACKSTAGE_REALTIME_LIVE_SMOKE=1` must be exported in the shell before the command starts.

## Default Behavior

Running the command without live-smoke env is safe:

```bash
pnpm preflight:realtime
pnpm smoke:realtime
```

Expected result:

- `pnpm preflight:realtime` prints only redacted set/unset readiness.
- `.env` / `.env.local` values are loaded as redacted metadata, but secret values are not printed.
- `voice-core` builds.
- `stage-broker` builds.
- The script exits successfully with a skipped message.
- No OpenAI network call is attempted.

## Live Smoke Env

Only run the live path from a local shell you control:

```bash
BLACKSTAGE_REALTIME_LIVE_SMOKE=1 \
OPENAI_API_KEY=... \
BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER=local-hashed-user-or-project-id \
BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN=local-approval-phrase \
pnpm smoke:realtime
```

If `OPENAI_API_KEY` is already present in `.env.local`, leave it there and export only the live-smoke arming values from the shell. If `.env.local` contains `BLACKSTAGE_REALTIME_LIVE_SMOKE=1`, preflight still reports `okToRun: false` unless the live flag was present in the shell before local env loading.

The command:

- starts a temporary local `apps/stage-broker` server on `127.0.0.1`;
- launches headless Chromium through Playwright;
- creates a WebRTC offer with an events data channel plus a `recvonly` audio media section;
- rejects any offer that can send browser audio or lacks the required data channel / `recvonly` audio section before the broker/provider exchange;
- POSTs the SDP offer through the broker with `x-blackstage-realtime-approval`;
- keeps the standard OpenAI API key server-side only;
- sends no microphone/audio track;
- caps the live-smoke timeout at 15 seconds;
- prints only safe proof metadata: byte counts, a short answer digest, and safety booleans.

## Current Local Result

The first passing armed smoke used a shell-provided safety identifier and approval token plus the local `.env.local` API key. It completed one brokered OpenAI Realtime SDP exchange with:

- `browserReceivesStandardApiKey: false`
- `browserSendsAudio: false`
- `offerMode: data_channel_plus_recvonly_audio`
- `audioDirections: ["recvonly"]`
- `maxProviderRequests: 1`
- `timeoutMs: 15000`
- redacted proof path under `.blackstage/realtime-smoke/`

Earlier armed attempts returned upstream HTTP 400 until the smoke offer included a `recvonly` audio media section and the server session omitted unsupported `metadata`. The broker now preserves only safe upstream diagnostics: HTTP status, request id when present, and sanitized OpenAI error fields.

`pnpm smoke:realtime-ui` now runs the same live edge through the actual Stage Web
startup choreography. When shell-armed, it clicks the startup orb, approves the
live Realtime edge, waits for `live SDP`, verifies a provider text response is
visible in the Stage assistant speech surface, verifies a provider function call
for `blackstage_prepare_external_action` becomes a Stage approval card, and
writes a redacted debug summary with event types, tool names, and elapsed timing.
The UI smoke still sends no microphone audio, exposes no standard API key to the
browser, stores no raw payloads in the proof, and stays capped by the cheap guard.

The browser bridge now has an approval-resolved local tool path for the same
function-call shape. After the human approves the Realtime tool request,
Stage Web can run the safe `blackstage.prepare_external_action` adapter, render
the result as stage work plus a review artifact, and send a `function_call_output`
item back over the already-open data channel when it is writable. The local tool
result records `externalSideEffects: false` and does not create another broker
POST, start microphone capture, or store raw provider payloads.

When `blackstage.realtimeDebug.enabled=1` or
`VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED=1` is enabled, Stage Web also shows a
quiet Realtime debug block in Research Trace after sanitized events exist. The
debug export records summary counts, event types, elapsed timing, observed tool
names, first-latency markers for bridge/data-channel/assistant/tool/audio
milestones, bridge status, mic preflight state, and `rawPayloadStored: false`.
It does not include raw provider payloads, raw audio, transcripts, SDP, API
keys, or approval phrases.

Run `pnpm preflight:realtime` first if you want to confirm that the shell is armed without starting the broker or creating an SDP offer.

To generate the non-API-key arming values for a controlled local shell, run:

```bash
pnpm prepare:realtime-smoke
```

The helper loads `.env` / `.env.local` only to detect whether `OPENAI_API_KEY` is already set, then prints shell `export` lines for `BLACKSTAGE_REALTIME_LIVE_SMOKE`, a stable hashed safety identifier, a fresh local approval token, an ignored `.blackstage/` proof path, and the 15-second timeout request. It also prints comments stating the cheap guard: SDP-only, data channel plus `recvonly` audio, no microphone track, shell-only live arming, and one provider request at most. It does not write an env file, does not print `OPENAI_API_KEY`, and does not make a network call.

## Redacted Proof File

If you want a local proof packet for the run, set an ignored `.blackstage/` path:

```bash
BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH=.blackstage/realtime-smoke/latest.json \
pnpm smoke:realtime
```

The proof writer records only redacted metadata: pass/fail/skip status, set/unset env readiness, byte counts, a short answer digest, cheap-guard metadata, and safety booleans. It rejects proof paths outside `.blackstage/` and does not write raw SDP, API keys, approval phrases, or browser trace artifacts.

The local broker also exposes read-only summaries at:

```text
GET /api/blackstage/realtime/proofs
```

The route returns sanitized proof summaries only. It omits `requiredEnv`, error detail, raw SDP, approval phrases, and provider credentials.

## Do Not Commit

Do not commit API keys, approval phrases, raw SDP answers, trace zips, browser artifacts, `.blackstage/` proof files, or local `.env` / `.env.local` files.
