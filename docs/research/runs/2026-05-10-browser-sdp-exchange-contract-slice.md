# Browser SDP Exchange Contract Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop by shaping the browser-side Realtime SDP exchange path while keeping live voice disabled by default.

## What Was Attempted

- Added a `voice-core` browser WebRTC SDP exchange adapter with injected peer-connection and fetch boundaries.
- Required explicit `enabled: true` before any peer connection or network work can start.
- Kept the contract data-channel-first with `oai-events`, no microphone request, no audio tracks, and no standard API key exposure.
- Added tests proving default blocking, successful injected SDP exchange, and rejection when the broker is not reachable.

## What Codex Did Well

- Advanced the live Realtime path without turning on live provider calls.
- Preserved the Stage-owned safety spine: readiness first, explicit enablement second, approval/event mapping before tools.
- Kept the browser contract testable in Node by avoiding direct dependence on real browser globals.

## What Needed Correction

- The adapter is still not invoked by Stage Web; that is intentional for this slice.
- A later slice must decide the explicit operator control and labeling for starting a live SDP exchange.

## Product Insight

The correct next live-voice shape is not "ask for microphone and hope." It is a visible, staged sequence: broker seen, explicit live exchange enabled, SDP exchanged, events mapped, tool calls approval-gated.

## AI-Building Insight

Injected WebRTC/fetch boundaries let the agent prove live-bridge safety properties without depending on real provider availability or local browser permissions.

## Evidence

- `pnpm --filter @blackstage/voice-core test`: passed with 20 Realtime subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed with 20 `voice-core`, 4 `memory-core`, 13 `agent-runtime`, and 5 `stage-broker` subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 175 tracked files after final staging.
