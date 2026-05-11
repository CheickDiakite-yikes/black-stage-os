# 26 Live Readiness Preflight

Status: Local operator runbook
Date: 2026-05-11

## Purpose

`pnpm preflight:live` is the aggregate no-action readiness check for Blackstage live integration gates. It runs the Realtime, Codex runner, and Agents SDK preflight logic in one process after loading local env metadata.

The command does not start the broker, start the runner, invoke Codex, start Agents SDK, call OpenAI, request microphone access, run tools, upload traces, inspect memory, write artifacts, or enqueue work.

## Default Behavior

```bash
pnpm preflight:live
```

Expected result:

- `noExternalActionTaken` is `true`.
- `okToRun` is `false` unless every live gate is shell-armed and its runtime requirements are present.
- Realtime, Codex runner, and Agents SDK sections report redacted readiness.
- Local `.env` / `.env.local` values are reported only as names and set/unset status.

## Safety Contract

Local env files may hold provider credentials such as `OPENAI_API_KEY`, but they cannot arm live work. Live flags and approval tokens must be exported in the shell before the preflight starts.

If any shell-armed gate is missing required shell/runtime values, `pnpm preflight:live` exits non-zero and lists the blocked gate in `shellArmedButBlocked`.

## Do Not Commit

Do not commit provider keys, approval phrases, raw traces, raw SDP, local workspaces, proof files, or local `.env` / `.env.local` files.
