# Stage Shell Demo Chrome Cleanup Slice

Date: 2026-05-11

## What Was Attempted

Remove visible demo-selector chrome from the Stage Shell, make object controls feel less like debug buttons, and make the idle orb the startup speech affordance.

## Prompt Given To Codex

The current UI has a weird demo look with buttons that show demos; clean that up. The startup UX should be: user clicks the orb and starts speaking.

## What Codex Did Well

- Removed the visible top-right fixture scenario rail from the product shell.
- Kept fixture scenarios reachable through typed intent in tests and normal use.
- Changed default Realtime/Harness edge copy from `simulation` to `standby`.
- Replaced verbose object action text with compact icon affordances while preserving accessible labels for keyboard and test targeting.
- Made the idle presence orb a real `Start speaking` button that enters the Web Speech capture path.
- Cleared legacy `blackstage.stageShell.v0` fixture sessions so old browsers do not reopen into a populated demo state.

## What Failed Or Needed Human Intervention

The founder clarified that the orb, not a visible control dock, is the startup speech interaction. Validation also caught that hidden idle workspace children were intercepting orb clicks and that compact drag controls needed a stepped pointer test.

## Product Insight

Blackstage should start from intent, not from a menu of demos. Fixture data can remain as implementation scaffolding, but the first viewport should not advertise that scaffolding. The startup interaction is physical and singular: press the orb, then speak.

## AI-Building Insight

Autonomous product loops need visual taste checks, not only passing tests. A UI can be technically correct while still leaking its harness.

## Evidence

- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/src/components/StageObjectCard.tsx`
- `apps/stage-web/src/styles/global.css`
- `apps/stage-web/tests/stage-shell.spec.ts`
