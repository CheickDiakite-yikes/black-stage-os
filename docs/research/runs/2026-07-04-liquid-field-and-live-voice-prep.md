# Liquid Field And Live Voice Prep

Date: 2026-07-04

## Attempt

Respond to Cheick's visual critique that the Fable-guided morphology pass looked
like a disaster/debug overlay rather than a liquid rendering field, then prepare
the real voice path for a founder-run microphone test.

## What Changed

- Softened the generated morphology layer in `global.css`: role/socket labels no
  longer render on the field, allocation frames became blurred material basins,
  grid scaffolding became a soft pressure veil, and packets read more like
  matter trails.
- Added pending approval visibility in active field mode so high-impact
  approvals, including live Realtime voice, are not hidden by the card-suppression
  morphology mode.
- Added a realtime-debug data flag so the research proof capsule can surface
  only when live Realtime debug evidence exists.
- Updated Playwright's web server command to use the repo-pinned pnpm version.

## Validation

- `corepack pnpm@8.15.7 --filter @blackstage/stage-web typecheck`
- `corepack pnpm@8.15.7 --filter @blackstage/stage-web exec playwright test tests/realtime-bridge.spec.ts`
- `corepack pnpm@8.15.7 --filter @blackstage/stage-web test:e2e --grep "startup-intent morphology demo URL|adapts morphology across research and planning scenarios|keeps morphology legible under reduced motion|streams intent into approval-gated artifacts|preserves generated morphology on phone viewport"`
- `corepack pnpm@8.15.7 exec eslint apps/stage-web/src/components/ApprovalCard.tsx apps/stage-web/src/components/ResearchCapture.tsx apps/stage-web/src/components/StageGeneratedStream.tsx apps/stage-web/tests/stage-shell.spec.ts`
- `corepack pnpm@8.15.7 exec prettier --check apps/stage-web/src/components/ApprovalCard.tsx apps/stage-web/src/components/ResearchCapture.tsx apps/stage-web/src/components/StageGeneratedStream.tsx apps/stage-web/src/styles/global.css apps/stage-web/tests/stage-shell.spec.ts apps/stage-web/playwright.config.ts`
- `git diff --check`

## Product Insight

Semantics should be available to the audit trail, but the default field cannot
print every semantic label onto the stage. The render field feels magical when
the user sees pressure, emergence, and approval ritual; it feels generic when
the user sees grids, labels, and diagnostic frames.

## AI-Building Insight

Fable was useful for finding expressive CSS directions, but it overfit to visible
semantics and produced too much surface machinery. The correcting pattern was to
preserve the schema and instrumentation while stripping the field-facing layer
back to fewer visible concepts.

## Remaining Risk

The live microphone path is ready for a human-run browser permission test, but no
human microphone audio was sent in this run. The realtime e2e proves local audio
track attachment with fake browser media after approval; the founder still needs
to approve the live edge and speak in the mic-enabled local preview.
