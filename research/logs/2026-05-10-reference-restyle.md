# Reference Restyle Log

**Date:** 2026-05-10

## What Changed

- Adjusted the idle Stage Shell toward the provided black celestial reference.
- Replaced the heavier app-title treatment with a smaller center presence and a spaced serif `Speak when ready` prompt.
- Added sparse orbital and constellation geometry around the edges of the stage.
- Kept the text fallback present, but reduced it to a quiet bottom affordance.
- Added `memory on · private` as an ambient trust/status line.

## Assumptions

- The provided image should steer the idle visual system before deeper Stage Shell behavior is built.
- Text fallback should remain available, but voice-native mood should dominate.

## Problems

- Mobile verification showed the text fallback and memory status overlapping. The bottom layout was adjusted for narrow screens.

## What Should Be Built Next

- Turn the center presence and edge geometry into reusable Stage UI primitives.
- Add interaction states for listening, thinking, approval needed, and working without losing the quiet celestial field.
