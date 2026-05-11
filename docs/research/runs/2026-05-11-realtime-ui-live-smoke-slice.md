# Realtime UI Live Smoke Slice

Date: 2026-05-11

## What Was Attempted

Close the gap between a backend-only Realtime smoke and visible browser magic by
adding a gated live UI smoke path.

## Prompt Given To Codex

Continue the Blackstage goal after the founder asked how close the repo is to a
live real test where the interface can show real magic.

## What Codex Did Well

- Added `pnpm smoke:realtime-ui`.
- Kept the live UI smoke shell-armed and skip-gated by default.
- Reused the same local approval token and safety identifier policy as the
  backend Realtime smoke.
- Starts the real local broker and Stage Web together when armed.
- Drives the real UI path: startup orb, approval card, live Realtime SDP status.
- Writes redacted proof and screenshot artifacts under `.blackstage/` when run.
- Keeps the browser from receiving the OpenAI key and disables browser audio send
  for this cheap proof.
- Fixed the live smoke harness to inject the broker URL through Stage Web runtime
  hooks and to allow the random Vite origin through the local broker.
- Ran the armed UI smoke successfully. It clicked the startup orb, approved the
  live edge, reached `live SDP`, and produced redacted proof at
  `.blackstage/realtime-smoke/live-2026-05-11T21-20-10-666Z.json` plus screenshot
  `.blackstage/realtime-smoke/ui-live-2026-05-11T21-20-18-131Z.png`.
- Added a tiny live text probe over the Realtime data channel after the approved
  SDP exchange.
- Fixed the probe to use the Realtime `output_modalities` response field.
- Ran the armed UI smoke successfully again. It clicked the startup orb, approved
  the live edge, reached `live SDP`, rendered `Blackstage live text proof
  received.` in the Stage assistant speech surface, and produced redacted proof
  at `.blackstage/realtime-smoke/live-2026-05-11T21-56-50-165Z.json` plus
  screenshot `.blackstage/realtime-smoke/ui-live-2026-05-11T21-56-56-004Z.png`.

## What Failed Or Needed Human Intervention

The current slice does not yet prove live microphone speech or a real user
transcript flowing into Stage objects. It now proves the approved
UI-to-provider Realtime edge with one live Realtime SDP exchange and one real
provider text event rendered in the Stage UI.

## Product Insight

The first live proof should happen through the same ritual the user will feel:
click the orb, approve the live edge, and watch the stage wake. A backend smoke
alone is too invisible for Blackstage.

## AI-Building Insight

Provider smoke tests need to preserve product choreography. If the test bypasses
the orb and approval surface, it can prove transport while missing the actual
experience.

## Evidence

- `scripts/smoke-realtime-ui-live.mjs`
- `package.json`
- `docs/22_reality_interface_completion_audit.md`
- `.blackstage/realtime-smoke/live-2026-05-11T21-20-10-666Z.json` (ignored,
  redacted proof)
- `.blackstage/realtime-smoke/ui-live-2026-05-11T21-20-18-131Z.png` (ignored
  screenshot)
- `.blackstage/realtime-smoke/live-2026-05-11T21-56-50-165Z.json` (ignored,
  redacted proof)
- `.blackstage/realtime-smoke/ui-live-2026-05-11T21-56-56-004Z.png` (ignored
  screenshot)
