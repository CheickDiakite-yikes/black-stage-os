# Agents SDK Manager Contracts Slice

Date: 2026-05-10
Run type: `/goal` implementation slice

## Prompt

Continue the Blackstage goal loop after adding Codex/Symphony/Realtimes contracts and a disabled local Codex runner boundary.

## What Was Attempted

- Add a local-only Agents SDK manager-plan contract for non-coding agent work.
- Keep research, artifact, and general agent tasks separate from Codex coding execution.
- Represent specialists as tools, not autonomous handoffs, by default.
- Keep memory inspection approval-gated.
- Record the plan through harness events without any live API call.

## What Codex Did Well

- Preserved the architecture split: Codex for code, Agents SDK for non-coding research/artifact workflows.
- Encoded the "manager agent with tools" posture in types and tests.
- Kept trace redaction and human review explicit.
- Added refusal coverage so coding work cannot silently route through the wrong adapter.

## What Failed Or Needed Human Intervention

- No OpenAI Agents SDK package was installed.
- No live agent, trace upload, model call, tool execution, memory write, or handoff was attempted.
- A future slice needs a configured live adapter and trace redaction store.

## Product Insight

Blackstage should not expose a swarm. It should expose one calm stage manager that can call specialists as bounded capabilities while the user sees proof, approvals, and artifacts.

## AI-Building Insight

Adapter refusal tests are as important as happy-path tests. They prevent provider boundaries from blurring as the harness grows.

## Evidence

- `packages/agent-runtime/src/harness/agentsSdkAdapter.ts`
- `packages/agent-runtime/test/inMemoryHarnessScheduler.test.mjs`
- `docs/21_agentic_harness_architecture.md`
