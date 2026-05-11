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

## Redacted Proof File

If you want a local proof packet for the run, set an ignored `.blackstage/` path:

```bash
BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH=.blackstage/realtime-smoke/latest.json \
pnpm smoke:realtime
```

The proof writer records only redacted metadata: pass/fail/skip status, set/unset env readiness, byte counts, a short answer digest, and safety booleans. It rejects proof paths outside `.blackstage/` and does not write raw SDP, API keys, approval phrases, or browser trace artifacts.

The local broker also exposes read-only summaries at:

```text
GET /api/blackstage/realtime/proofs
```

The route returns sanitized proof summaries only. It omits `requiredEnv`, error detail, raw SDP, approval phrases, and provider credentials.

## Do Not Commit

Do not commit API keys, approval phrases, raw SDP answers, trace zips, browser artifacts, `.blackstage/` proof files, or local `.env` files.
