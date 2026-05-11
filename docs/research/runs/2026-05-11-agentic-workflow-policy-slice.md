# Agentic Workflow Policy Slice

Date: 2026-05-11

## Why this slice

The background harness direction now points at open-source Codex, Symphony-style orchestration, Agents SDK manager plans, and `gpt-realtime-2`. That should live as a repo-owned operating policy, not only as chat context or architecture prose.

## Prompt

Continue the active Blackstage goal loop and incorporate the direction to leverage Codex, Symphony orchestration, and Realtime voice 2 without letting those tools bypass the stage.

## What changed

- Added root `WORKFLOW.md` as the Blackstage background harness policy.
- Added typed `HarnessWorkflowPolicy` metadata in `agent-runtime`.
- Exposed the workflow policy through Symphony-style control-plane snapshots.
- Exposed the same policy through local harness runner readiness without browser execution rights.
- Updated architecture and audit docs to make the workflow policy part of the implementation surface.

## Validation

- `pnpm build`: passed across the sorted workspace.
- `pnpm typecheck`: passed across 8 of 9 workspace projects.
- `pnpm lint`: passed.
- `pnpm test`: passed with 23 `voice-core` subtests, 4 `memory-core` subtests, 15 `agent-runtime` subtests, 9 `stage-broker` subtests, and 13 `stage-runner` subtests.
- `pnpm --filter @blackstage/agent-runtime test`: passed with 15 harness subtests.
- `pnpm --filter @blackstage/stage-runner test`: passed with 13 local runner subtests.
- `pnpm smoke:realtime`: passed in default skip-gated mode; no live OpenAI call was made.
- `pnpm exec prettier --check ...`: passed for the touched files.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 206 tracked files after staging.

## Product insight

The foreground should stay a living stage, but the background can borrow mature orchestration patterns. A repo-owned workflow policy lets Blackstage leverage Codex and Symphony while keeping the product thesis intact.

## AI-building insight

Provider choices should become typed policy metadata early. That gives future agents a stable contract to inspect instead of relying on stale architecture text or hidden assumptions.
