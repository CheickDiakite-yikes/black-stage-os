# Agent Memory Policy Slice

Date: 2026-05-11

## What Was Attempted

Tighten the background agentic harness so OpenAI Agents SDK manager plans can leverage Codex/Symphony/Realtime-adjacent orchestration without quietly gaining raw memory access.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop after the founder suggested leveraging open-source Codex, Symphony-style agentic orchestration, and `gpt-realtime-2`; preserve approval gates and auditability.

## What Codex Did Well

- Added a typed Agents SDK memory-access policy for dry-run manager plans.
- Kept background agents on redacted memory summaries by default.
- Required Stage approval for memory inspection, writes, and deletes.
- Surfaced the memory boundary through `HarnessWorkflowPolicy` and the quiet Stage Web harness line.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live provider call was made.

## Product Insight

The backstage harness can become powerful only if memory stays sacred. A visible memory-approval policy keeps the calm stage feeling while preventing background autonomy from becoming spooky.

## AI-Building Insight

Provider orchestration should inherit Blackstage policy as typed data, not rely on prompt text alone. Dry-run proof events make the boundary testable before any live Agents SDK run exists.

## Evidence

- `pnpm --filter @blackstage/agent-runtime test`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/harness-policy.spec.ts`
- `pnpm check:workflow`
- `pnpm lint`
- `pnpm scan:secrets`
