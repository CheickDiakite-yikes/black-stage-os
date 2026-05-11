# 23 Realtime Live Smoke

Status: Local operator runbook
Date: 2026-05-11

## Purpose

`pnpm smoke:realtime` is the first repo-backed path for proving the local Realtime broker against a real OpenAI Realtime SDP exchange. It is skip-gated by default and does not call OpenAI unless the operator explicitly arms it.

## Default Behavior

Running the command without live-smoke env is safe:

```bash
pnpm preflight:realtime
pnpm smoke:realtime
```

Expected result:

- `pnpm preflight:realtime` prints only redacted set/unset readiness.
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

The command:

- starts a temporary local `apps/stage-broker` server on `127.0.0.1`;
- launches headless Chromium through Playwright;
- creates a data-channel-only WebRTC offer in the browser;
- POSTs the SDP offer through the broker with `x-blackstage-realtime-approval`;
- keeps the standard OpenAI API key server-side only;
- sends no microphone/audio track;
- prints only safe proof metadata: byte counts, a short answer digest, and safety booleans.

Run `pnpm preflight:realtime` first if you want to confirm that the shell is armed without starting the broker or creating an SDP offer.

## Do Not Commit

Do not commit API keys, approval phrases, raw SDP answers, trace zips, browser artifacts, or local `.env` files. The live smoke output should stay as console evidence unless a later task creates a redacted proof format.
