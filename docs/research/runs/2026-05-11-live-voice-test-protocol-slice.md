# Live Voice Test Protocol Slice

Date: 2026-05-11

## What Was Attempted

Turn the live Realtime/tool-call/debug work into a practical protocol the
founder can run locally with cheap defaults and useful evidence export.

## Prompt Given To Codex

The founder said they can do the live voice testing and wants debug data for
tools, latency, response, and audio after the session. The priority is proving
live interaction can actually do tool/function calling and making sure the
rendering feels good.

## What Codex Did Well

- Added a manual live voice protocol centered on the startup orb interaction.
- Split the runbook into cheap no-mic proof, manual no-mic tool proof, and real
  microphone session.
- Documented the exact broker and Stage Web env needed for local runs.
- Defined what debug artifacts to export after a session.
- Updated the doc index so live-readiness runbooks are discoverable.
- Updated the completion audit so the remaining Realtime gap is human-tested
  microphone stability, not the first safe local tool execution path.

## What Failed Or Needed Human Intervention

No human intervention was needed in this documentation slice. Human voice
testing is still the next validation step.

## Product Insight

The right live-test UX is still the product UX: idle black field, click orb,
speak, approve high-impact actions, and let the stage render visible work. Debug
mode should support that flow without becoming the interface.

## AI-Building Insight

The fastest next feedback loop is not another synthetic test. It is a
human-run session with exported redacted timing/tool/audio evidence, plus a
short subjective read on whether the render field still feels calm and magical
under real interaction.

## Evidence

- `docs/27_live_voice_test_protocol.md`
- `docs/00_document_index.md`
- `docs/22_reality_interface_completion_audit.md`
