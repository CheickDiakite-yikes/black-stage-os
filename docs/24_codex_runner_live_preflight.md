# 24 Codex Runner Live Preflight

Status: Local operator runbook
Date: 2026-05-11

## Purpose

`pnpm preflight:codex-runner` is the no-execution readiness check for the local Codex worker boundary. It does not start the runner service, enqueue work, run Codex, call providers, or write files. It only reports whether the current shell is armed for live Codex subprocess work.

## Default Behavior

Running the command without live runner env is safe:

```bash
pnpm preflight:codex-runner
```

Expected result:

- `okToRun` is `false`.
- `codexSubprocessWouldRun` is `false`.
- Browser mutation rights remain disabled.
- Browser provider credentials remain unavailable.
- Local `.env` / `.env.local` values are reported only as redacted metadata.

## Live Runner Env

Only arm live Codex subprocess work from a local shell you control:

```bash
BLACKSTAGE_CODEX_SUBPROCESS_ENABLED=1 \
BLACKSTAGE_CODEX_RUN_APPROVAL_TOKEN=local-approval-phrase \
pnpm preflight:codex-runner
```

The preflight reports `okToRun: true` only when both live runner values are present in the shell before local env loading. If `.env.local` contains either value, preflight still reports `okToRun: false` unless the shell already supplied them.

## Safety Contract

The live runner still requires the local Stage Runner service and a matching `x-blackstage-codex-approval` header before `POST /api/blackstage/harness/run-next` can execute work. The browser cannot enqueue or run Codex directly.

## Do Not Commit

Do not commit Codex approval phrases, worker prompts with personal data, `.blackstage/` workspace proof files, trace artifacts, or local `.env` / `.env.local` files.
