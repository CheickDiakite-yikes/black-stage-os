# Harness Upstream Matrix Slice

Date: 2026-05-11

## What Was Attempted

Turn the Codex, Symphony, Agents SDK, and Realtime voice harness direction into source-pinned runtime policy instead of leaving it only in prose.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop and evaluate whether the background agentic harness should leverage open-source Codex, OpenAI Symphony-style orchestration, and the newer OpenAI Realtime voice stack.

## What Codex Did Well

- Added a typed upstream integration matrix to `HarnessWorkflowPolicy`.
- Kept each upstream capability behind Blackstage-owned boundaries: no browser mutation, no browser provider credentials, and high-impact approval required.
- Exposed the matrix through the existing Stage runner readiness and Stage Web harness policy line.
- Updated `WORKFLOW.md`, the architecture note, and the completion audit to match the runtime policy.

## What Failed Or Needed Human Intervention

No human intervention was needed. No live Codex worker, Agents SDK run, Realtime session, microphone stream, or external tracker integration was started.

## Product Insight

The right product shape is not "add agents in the background." It is a visible source-pinned harness where each upstream capability has a clear role, a proof path, and a Blackstage approval boundary.

## AI-Building Insight

Runtime policy should carry the source assumptions that guide future agents. That makes later Codex work less likely to drift from the chosen harness stack.

## Evidence

- `pnpm --filter @blackstage/agent-runtime test`
- `pnpm --filter @blackstage/stage-runner test`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/harness-policy.spec.ts`
- `pnpm lint`
- `pnpm check:workflow`
- `pnpm scan:secrets`
