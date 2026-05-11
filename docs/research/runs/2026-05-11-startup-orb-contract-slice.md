# Startup Orb Contract Slice

Date: 2026-05-11

## What Was Attempted

Lock the startup UX around a single voice-first interaction: click the center orb,
then speak. Demo fixtures must remain implementation scaffolding, not first-frame
product chrome.

## Prompt Given To Codex

The founder clarified that when the user is ready to speak and interact, they
simply click the orb and start speaking.

## What Codex Did Well

- Audited the current Stage Shell startup path against saved fixture hydration.
- Confirmed the current source already hides demo scenario labels and keeps the
  startup orb as the speech affordance.
- Tightened the focused idle-orb browser test so cold startup does not fail the
  contract before the page can finish rendering.
- Added an explicit MVP spec note that the first frame has no demo selector or
  control dock and starts from the center orb.

## What Failed Or Needed Human Intervention

The focused browser test initially timed out under the default test budget during
cold startup. The failure did not show demo chrome in the snapshot, but it made
the goal loop less trustworthy until the startup contract test was stabilized.

## Product Insight

The orb is not decoration. It is the first physical action in Blackstage: press
the living center, then speak the world into shape.

## AI-Building Insight

Aesthetic startup rules need executable tests as much as prose. Otherwise old
fixture affordances can leak back into the first impression unnoticed.

## Evidence

- `apps/stage-web/tests/stage-shell.spec.ts`
- `docs/06_mvp_stage_shell_spec.md`
