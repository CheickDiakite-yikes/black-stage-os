# Local Memory Recall Slice

Date: 2026-05-11

## What Was Attempted

Add deterministic local memory recall so approved memory can be ranked and shown on the stage without an embedding service or live agent call.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop and address the memory gap called out in the completion audit.

## What Codex Did Well

- Turned the placeholder retrieval query into a tested deterministic ranker.
- Added a `recall` command that inspects approved redacted memory only.
- Rendered recall matches inside the existing memory surface instead of adding a dashboard.
- Kept write and delete approval gates unchanged.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice does not add embedding retrieval, cross-thread review UI, or live memory-agent enforcement.

## Product Insight

Memory becomes more stage-native when the user can ask for it and see ranked local evidence appear as an object, instead of treating memory as invisible background state.

## AI-Building Insight

A deterministic lexical ranker is enough to harden contracts before adding model-backed retrieval. It gives tests a stable baseline and makes later embedding changes measurable.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/memory-core test`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "memory writes"`
- `pnpm exec prettier --check packages/memory-core/src/retrieval/retrievalQuery.ts packages/memory-core/test/localMemoryVault.test.mjs apps/stage-web/src/app/App.tsx apps/stage-web/src/components/StageObjectCard.tsx apps/stage-web/src/styles/global.css apps/stage-web/tests/stage-shell.spec.ts docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-local-memory-recall-slice.md`
- `pnpm lint`
- `pnpm scan:secrets`
- `git diff --check`
