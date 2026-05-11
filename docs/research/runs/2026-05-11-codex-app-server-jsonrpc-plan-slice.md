# Codex App Server JSON-RPC Plan Slice

Date: 2026-05-11

## What Was Attempted

Turn the Codex App Server harness boundary from a named transport into a dry-run request plan the Blackstage harness can inspect before any live process or network call is armed.

## Prompt Given To Codex

Continue the `/goal` loop after the founder suggested leveraging open-source Codex, OpenAI Symphony orchestration, and `gpt-realtime-2` for the background harness.

## What Codex Did Well

- Kept Codex App Server behind a Blackstage-owned handoff packet.
- Added a source-aligned JSON-RPC plan for `initialize`, `initialized`, `thread/start`, and `turn/start`.
- Preserved the browser safety boundaries: no browser mutation, no provider credentials in the browser, no live transport by default.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice intentionally stopped at a dry-run plan; no live App Server process ran.

## Product Insight

The harness should make upstream orchestration concrete enough to audit without putting provider mechanics on the stage as the product metaphor.

## AI-Building Insight

A live worker path becomes safer when the repo first owns the protocol envelope, approval posture, workspace path, validation commands, and proof event shape in a deterministic contract.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/agent-runtime typecheck`
- `pnpm --filter @blackstage/agent-runtime test`
- `pnpm exec prettier --check packages/agent-runtime/src/harness/codexWorkerAdapter.ts packages/agent-runtime/test/inMemoryHarnessScheduler.test.mjs docs/21_agentic_harness_architecture.md docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-codex-app-server-jsonrpc-plan-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
