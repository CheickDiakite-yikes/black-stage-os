# Harness Stack Visibility Slice

Date: 2026-05-11

## What Was Attempted

Make the visible Stage Web harness policy line reflect the full background agentic stack: Symphony-style queue, Codex CLI, Agents SDK manager, and `gpt-realtime-2`.

## Prompt Given To Codex

Continue the `/goal` loop after the founder suggested leveraging open-source Codex, OpenAI Symphony orchestration, and the new Realtime voice path for the background harness.

## What Codex Did Well

- Found the existing typed workflow policy display instead of adding a new surface.
- Added the missing Agents SDK manager label to the calm `Harness edge` line.
- Tightened the browser test so the rendered stack cannot omit the non-coding manager-agent path.

## What Failed Or Needed Human Intervention

No human intervention was needed.

## Product Insight

The stack should be visible enough to make the harness auditable, but not so prominent that Blackstage turns into a dashboard. A single source-backed policy line is the right v0 surface.

## AI-Building Insight

When provider architecture changes, the fastest safe path is to bind it to an existing typed policy and browser assertion. That keeps the long-running build from accumulating undocumented strategy drift.

## Evidence

Validation for this slice should include:

- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web test:e2e -- tests/harness-policy.spec.ts`
- `pnpm exec prettier --check apps/stage-web/src/components/StageShell.tsx apps/stage-web/tests/harness-policy.spec.ts docs/research/runs/2026-05-11-harness-stack-visibility-slice.md`
- `pnpm scan:secrets`
- `git diff --check`
