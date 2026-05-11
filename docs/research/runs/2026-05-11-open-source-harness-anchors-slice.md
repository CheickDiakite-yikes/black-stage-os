# Open-Source Harness Anchors Slice

Date: 2026-05-11

## What Was Attempted

Make the founder's direction to leverage open-source Codex and OpenAI Symphony durable in the typed harness policy, not only in architecture prose.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop, commit and push as progress is validated, and incorporate the idea that the background agentic harness should leverage open-source Codex, OpenAI open-source Symphony orchestration, and the new Realtime voice path.

## What Codex Did Well

- Preserved Blackstage's existing split: Codex for coding work, Symphony as orchestration pattern, Agents SDK for manager-style non-coding agents, and `gpt-realtime-2` as the voice edge.
- Added explicit open-source anchors for `https://github.com/openai/codex` and `https://github.com/openai/symphony` to the typed `HarnessWorkflowPolicy`.
- Extended the workflow-policy checker so the anchor contract cannot silently drift out of docs or source.

## What Failed Or Needed Human Intervention

No human intervention was needed. This slice did not start live Codex, App Server, Symphony, Agents SDK, Realtime, microphone, or external network execution.

## Product Insight

Open-source infrastructure should strengthen the background harness, not become the user's product metaphor. Blackstage still needs the foreground to feel like a living stage while the source-pinned harness quietly earns trust behind it.

## AI-Building Insight

Provider/source decisions belong in typed runtime policy when future agents will rely on them. Prose is useful for taste and rationale, but policy metadata gives later automation a smaller surface to misread.

## Evidence

- `WORKFLOW.md`
- `packages/agent-runtime/src/harness/workflowPolicy.ts`
- `scripts/check-workflow-policy.mjs`
- `docs/19_source_notes_codex.md`
- `docs/21_agentic_harness_architecture.md`
- `apps/stage-web/tests/harness-policy.spec.ts`
