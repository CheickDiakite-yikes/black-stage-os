# Orb-First Listening Startup Slice

Date: 2026-05-11

## What Was Attempted

Make the idle startup interaction match the product rule: click the center orb, then speak.

## Prompt Given To Codex

Continue the active Blackstage goal loop, keep committing and pushing as we go, and make the startup UX use the orb as the direct voice entrypoint.

## What Codex Did Well

- Kept the first viewport clean and free of demo selector chrome.
- Made the center presence change to `Listening` after the orb is clicked.
- Surfaced interim speech in the center presence so the startup interaction does not depend on the hidden lower dock.
- Added e2e coverage for orb click, listening copy, interim speech, and final voice-origin intent submission.

## What Failed Or Needed Human Intervention

No human intervention was needed. The Browser plugin Node runtime was not exposed in this session, so rendered validation used Playwright as the fallback.

## Product Insight

The first interaction should feel like waking the stage, not operating a form. Showing speech directly in the center presence makes the orb feel like the actual front door.

## AI-Building Insight

Taste fixes need rendered proof. A test can prove voice submission works, but the visual proof shows whether the startup state still feels like Blackstage.

## Evidence

- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/src/styles/global.css`
- `apps/stage-web/tests/stage-shell.spec.ts`
- `/tmp/blackstage-orb-listening-proof.png`
