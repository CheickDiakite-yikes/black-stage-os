# Live Voice Arming Helper Slice

Date: 2026-05-11

## What Was Attempted

Reduce friction before the first human live voice test by adding a safe helper
that prints the exact local broker and Stage Web commands.

## Prompt Given To Codex

Continue toward the active Blackstage goal after live debug export and live
voice protocol work. The next concrete action should move the project closer to
a real voice/tool/function-calling test without repeating completed work.

## What Codex Did Well

- Added `pnpm prepare:live-voice` as a no-side-effect command printer.
- Kept provider calls and microphone streams gated behind the actual Stage Web
  orb click, approval, and browser permission.
- Generated commands for no-mic, no-mic-plus-tool-probe, and mic-enabled runs.
- Added a script test proving the helper does not print an API key assignment
  and preserves local approval/safety guardrails.
- Updated live voice docs so the helper is discoverable before manual testing.

## What Failed Or Needed Human Intervention

No human intervention was needed. A human microphone session is still required
to validate the real startup voice loop.

## Product Insight

The first live test should feel like clicking the orb, not wrestling with env
vars. A command printer is the right bridge because it reduces setup friction
without making live API or microphone behavior automatic.

## AI-Building Insight

For live-agent systems, the operator path itself is part of the product
readiness surface. Guardrailed command generation is a useful intermediate
between a synthetic smoke test and a real user session.

## Evidence

- `scripts/prepare-live-voice-test-env.mjs`
- `scripts/test/live-voice-test-env.test.mjs`
- `package.json`
- `docs/23_realtime_live_smoke.md`
- `docs/27_live_voice_test_protocol.md`
