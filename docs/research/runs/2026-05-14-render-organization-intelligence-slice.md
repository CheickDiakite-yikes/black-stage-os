# Render Organization Intelligence Slice

Date: 2026-05-14

## What Was Attempted

Respond to the critique that the active Stage Shell still lacked organization
intelligence and display quality. The goal was to make the workspace read less
like scattered demo cards and more like an intent thread that knows which
objects are primary, supporting, pending, and output-bound.

## Prompt Given To Codex

Use the Browser plugin for local rendered validation and improve the active
rendering UX because the current active field is not good enough.

## What Codex Did Well

- Promoted the plan object into a larger primary display surface.
- Added a compact thread topology strip for normal-height active sessions.
- Rebalanced the active field so intent, plan, evidence, approvals, and
  artifacts have clearer spatial roles.
- Reduced duplicate mission chrome and made the research trace less visually
  competitive.
- Added short-viewport behavior so Browser-plugin screenshots do not show text
  input and trace panels colliding with the work.

## What Failed Or Needed Human Intervention

The first pass still looked too crowded in the Browser plugin's compact in-app
viewport. The layout needed a second pass that hides secondary chrome in shallow
viewports and keeps the primary work visible.

## Product Insight

Organization intelligence must be visible before real tool calling feels
magical. The stage should make hierarchy obvious: what is the user's intent,
what is the current display, what evidence supports it, what needs approval,
and what output is forming.

## AI-Building Insight

Browser-plugin validation is useful because it exercises the actual in-app
surface. Its compact viewport also exposes overlap and crowding that a large
headless screenshot can miss.

## Evidence

- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/src/styles/global.css`
- `apps/stage-web/tests/stage-shell.spec.ts`
- `BlackStage_OS_Development_Tracker.xlsx`
- Browser plugin screenshot: `/tmp/blackstage-browser-organized-active-compact-v3.png`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "streams intent into approval-gated artifacts"`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm scan:secrets`
