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

## What Failed Or Needed Human Intervention

The current slice does not yet prove live microphone speech or a real provider
transcript flowing into Stage objects. It proves the approved UI-to-provider
Realtime edge.

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
