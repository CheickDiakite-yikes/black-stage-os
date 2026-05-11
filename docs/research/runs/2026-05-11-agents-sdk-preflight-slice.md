# Agents SDK Preflight Slice

Date: 2026-05-11

## What Was Attempted

Add a no-call preflight for the future live Agents SDK manager-agent path so non-coding background agents remain explicit, redacted, and approval-gated before any provider run exists.

## Prompt Given To Codex

Continue the active Blackstage goal loop after Realtime and Codex runner preflights, and move the Agents SDK/Symphony orchestration path closer to safe live readiness without running external agents.

## What Codex Did Well

- Added `pnpm preflight:agents-sdk` with redacted runtime and shell readiness.
- Required shell-provided live SDK and approval-token flags before any live manager-agent run can be considered armed.
- Allowed `OPENAI_API_KEY` to remain local while emitting only set/unset status.
- Preserved the dry-run manager contract: no browser execution rights, no handoffs, redacted trace summaries, and no raw memory access.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live Agents SDK call, OpenAI network call, tool execution, trace upload, memory action, or handoff ran.

## Product Insight

The product should not hide research/product agents behind vague automation. The user should see a calm readiness boundary before any manager agent can act.

## AI-Building Insight

Realtime, Codex, and Agents SDK paths now share a safety grammar: shell-only live arming, local approval token, redacted env status, browser-safe reporting, and no external action during preflight.

## Evidence

- `scripts/preflight-agents-sdk.mjs`
- `scripts/test/agents-sdk-preflight.test.mjs`
- `docs/25_agents_sdk_live_preflight.md`
