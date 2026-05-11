# Workflow Policy Check Slice

Date: 2026-05-11

## Why this slice

`WORKFLOW.md` became the repo-owned policy for the agentic harness. The next risk was silent drift between that document, the typed harness policy, and the local runner readiness payload.

## Prompt

Continue the Blackstage goal loop and keep committing small validated slices while making the Codex/Symphony/Realtime harness direction durable.

## What changed

- Added `scripts/check-workflow-policy.mjs`.
- Added `pnpm check:workflow`.
- Made root `pnpm test` run the workflow policy check before package tests.
- Added `pnpm check:workflow` to the `WORKFLOW.md` validation floor.

## Validation

- `pnpm check:workflow`: passed across 9 contract checks.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed across 8 of 9 workspace projects.
- `pnpm test`: passed, including the workflow policy check plus 23 `voice-core` subtests, 4 `memory-core` subtests, 15 `agent-runtime` subtests, 9 `stage-broker` subtests, and 13 `stage-runner` subtests.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 208 tracked files after staging.

## Product insight

The workflow policy should be treated like a product contract, not a README. A small check keeps the harness from becoming a loose collection of aspirational notes.

## AI-building insight

For agent-built systems, doc/code drift starts immediately unless it is cheap to detect. Lightweight repository checks are often enough to keep future autonomous work aligned.
