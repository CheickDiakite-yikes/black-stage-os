# Soft Animation Log

**Date:** 2026-05-10

## What Changed

- Added slow-moving starfield layers behind the Stage Shell.
- Added a subtle fluid field layer under the center presence.
- Animated constellation geometry with gentle drift, opacity breathing, and node pulses.
- Added soft center presence motion: ring drift, core pulse, light sweep, and prompt-line breathing.
- Preserved reduced-motion support by keeping all motion CSS-animation based.

## Assumptions

- The idle scene should feel alive at the edge of perception rather than visibly busy.
- Motion should reinforce the voice-native stage mood without creating a normal app loading screen.

## Problems

- The first animation pass made the constellation lines feel too dashed in still screenshots. The lines were returned to continuous fine strokes while keeping soft opacity motion.

## What Should Be Built Next

- Define reusable stage animation tokens in `packages/stage-ui`.
- Add named animation states for idle, listening, thinking, working, and approval needed.
