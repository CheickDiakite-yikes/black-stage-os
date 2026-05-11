# 25 Agents SDK Live Preflight

Status: Local operator runbook
Date: 2026-05-11

## Purpose

`pnpm preflight:agents-sdk` is the no-call readiness check for a future live Agents SDK manager-agent path. It does not start an agent, call OpenAI, create traces, run tools, inspect memory, write artifacts, or hand off work. It only reports whether the current shell is armed for live manager-agent execution.

## Default Behavior

Running the command without live SDK env is safe:

```bash
pnpm preflight:agents-sdk
```

Expected result:

- `okToRun` is `false`.
- `agentsSdkRunWouldStart` is `false`.
- Browser mutation rights remain disabled.
- Browser provider credentials remain unavailable.
- Handoffs remain disabled.
- Raw memory access remains forbidden.
- Local `.env` / `.env.local` values are reported only as redacted metadata.

## Live SDK Env

Only arm live Agents SDK manager-agent work from a local shell you control:

```bash
BLACKSTAGE_AGENTS_SDK_LIVE_ENABLED=1 \
BLACKSTAGE_AGENTS_SDK_RUN_APPROVAL_TOKEN=local-approval-phrase \
pnpm preflight:agents-sdk
```

`OPENAI_API_KEY` may come from the shell or ignored `.env.local`, but the live SDK flag and approval token must be present in the shell before local env loading. If `.env.local` contains the live flag or approval token, preflight still reports `okToRun: false` unless the shell already supplied them.

## Safety Contract

Future live Agents SDK work must inherit the dry-run manager contract: specialists behave as tools, handoffs stay disabled unless separately approved, memory retrieval uses redacted summaries, memory inspection/write/delete require Stage approval, and trace output is limited to Stage event summaries.

## Do Not Commit

Do not commit OpenAI keys, Agents SDK approval phrases, raw traces, memory payloads, generated artifacts with personal data, or local `.env` / `.env.local` files.
