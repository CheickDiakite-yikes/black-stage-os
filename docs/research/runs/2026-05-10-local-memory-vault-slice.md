# Local Memory Vault Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop for Blackstage, commit and push as we go, and fold the agentic harness direction around open-source Codex, Symphony orchestration, and `gpt-realtime-2` into the build without turning the Stage into a generic chatbot or task dashboard.

## What Was Attempted

- Added a local memory vault contract with proposed, approved, rejected, and deleted memory states.
- Routed Stage `remember ...` commands through an explicit `memory_write` approval request.
- Routed Stage `forget ...` / `delete memory ...` commands through an explicit `memory_delete` approval request.
- Rendered memory records as inspectable Stage memory objects with redacted summaries.
- Persisted memory records in the local Stage session snapshot.
- Kept the live-provider stance clear: Codex and Symphony belong in the background harness; `gpt-realtime-2` belongs at the voice edge; Blackstage keeps the visible event, approval, and replay spine.

## What Codex Did Well

- Preserved the local-first, approval-gated thesis instead of introducing a real provider dependency too early.
- Added focused memory-core tests before treating the Stage UI path as done.
- Kept memory inspection redacted so sensitive-looking values do not become casual render payloads.

## What Needed Correction

- The browser e2e suite had brittle timing around animated controls. The test was updated to assert stable state, use forced clicks for known animated controls, and give the heavier Stage proof flows enough time on the local machine.

## Product Insight

Memory feels right when it is visible as an object, not hidden as a silent personalization layer. The user should see when the Stage wants to remember something, approve or reject it, and later delete it through the same calm approval ritual.

## AI-Building Insight

Provider power should be treated as a backend capability, not the product metaphor. Open-source Codex, Symphony-style work queues, Agents SDK manager patterns, and Realtime voice can all fit if they emit Blackstage events, respect approval gates, and remain replayable.

## Evidence

- `pnpm test:e2e`: passed with 9 browser tests after the memory-vault slice.
- Additional gates to rerun before commit: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm scan:secrets`.
