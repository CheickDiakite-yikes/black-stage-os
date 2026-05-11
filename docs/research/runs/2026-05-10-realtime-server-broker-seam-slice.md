# Realtime Server Broker Seam Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop and shape the background agentic harness around open-source Codex, Symphony-style orchestration, and OpenAI Realtime voice, especially the newer `gpt-realtime-2` path.

## What Was Attempted

- Added a typed trusted-server WebRTC broker request envelope in `voice-core`.
- Kept live Realtime disabled by default unless live mode, `OPENAI_API_KEY`, safety identifier, configured-live session mode, and browser SDP are all present.
- Made the browser contract explicit: the browser sends only an SDP offer and receives only an SDP answer; it never receives the standard API key or the safety identifier.
- Preserved the provider stance from the architecture doc: Realtime is the voice edge, while Codex/Symphony/Agents SDK remain background harness capabilities behind Blackstage events and approvals.

## What Codex Did Well

- Avoided adding a server framework before the product boundary was clear.
- Turned a live-provider idea into a replayable contract that can be tested without network calls.
- Added focused Node tests proving both the disabled default and the allowed live request envelope.

## What Needed Correction

- The first implementation needed explicit narrowing for optional SDP and safety identifier fields before TypeScript would accept the enabled request branch.

## Product Insight

The Stage should not expose "API mode" to the user. Live voice should feel like the same calm field waking up, while the machinery stays behind a trusted broker and emits ordinary Stage events.

## AI-Building Insight

The safest path to live providers is to define the contract first, then implement the route. This makes the future server route reviewable before any key, microphone stream, or external call enters the system.

## Evidence

- `pnpm --filter @blackstage/voice-core test`: passed with 6 voice-core subtests.
- Full repo validation is required before commit.
