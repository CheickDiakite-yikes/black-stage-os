# Orb Click Stability Slice

Date: 2026-05-11

## What Was Attempted

Validate the actual Stage Web rendering after the live Realtime tool-call slice
and keep the startup orb beautiful while making it easier to click and test.

## Prompt Given To Codex

Continue the Blackstage goal after the founder emphasized that rendering is very
important and that the live interaction should be able to use tools.

## What Codex Did Well

- Opened the real local Stage Web surface in a browser at `http://127.0.0.1:5175/`.
- Verified the idle view remains empty, dark, cinematic, and free of demo buttons.
- Found that the presence orb's own rotation/scale animation made Playwright
  treat the button as unstable for clicking.
- Kept the visual breathing effect but removed transform/rotate animation from
  the clickable button itself.
- Verified the orb can now be clicked normally and transitions to `Listening`.

## What Failed Or Needed Human Intervention

No human intervention was needed. The issue was visual/interaction stability,
not product direction.

## Product Insight

The living field can animate around the control, but the actual control target
must stay stable. The startup ritual is too important to depend on a constantly
transforming button.

## AI-Building Insight

Browser automation caught a product-quality issue that ordinary screenshots
alone would miss: the surface looked right, but the main control was not stable
enough for robust interaction testing.

## Evidence

- `apps/stage-web/src/styles/global.css`
- Browser visual pass: idle page loaded with no warnings/errors.
- Browser interaction pass: `Start voice input` orb click succeeded and rendered
  `Listening`.
