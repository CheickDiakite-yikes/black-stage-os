# Spoken Artifact Revision Slice

Date: 2026-05-11

## What Was Attempted

Let spoken correction edit the active artifact through a deterministic command instead of starting a new thread.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop and address the speech-correction gap without repeating completed object-command work.

## What Codex Did Well

- Added a narrow artifact revision command path for typed or spoken input.
- Reused the existing artifact revision serializer and research instrumentation.
- Added browser coverage for a spoken artifact edit and voice-origin trace evidence.

## What Failed Or Needed Human Intervention

No human intervention was needed. The slice intentionally supports deterministic active-artifact replacement, not arbitrary natural-language document editing.

## Product Insight

Voice correction feels much more like directing intelligence when it can change an artifact, not only move objects around the stage.

## AI-Building Insight

Constrained command grammar is a useful bridge before model-backed editing. It creates auditable event contracts for later richer correction semantics.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "artifact revision"`
- `pnpm exec prettier --check apps/stage-web/src/app/App.tsx apps/stage-web/tests/stage-shell.spec.ts docs/22_reality_interface_completion_audit.md docs/research/runs/2026-05-11-spoken-artifact-revision-slice.md`
- `pnpm lint`
- `pnpm scan:secrets`
- `git diff --check`
