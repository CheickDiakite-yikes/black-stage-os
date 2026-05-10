# Local Assistant Speech Slice

Date: 2026-05-10
Run type: `/goal` implementation slice

## Prompt

Continue the Blackstage goal loop, commit and push as we go, and incorporate the direction that the background harness should leverage open-source Codex, OpenAI Symphony-style orchestration, and `gpt-realtime-2`.

## What Was Attempted

- Add a local browser-native assistant speech output path without live OpenAI API calls.
- Keep spoken output sparse so the Stage Shell feels calm rather than chatty.
- Record speech as `assistant.speech` stage events and `assistant_speech` research events.
- Refresh the harness architecture note to treat Codex, Symphony, Agents SDK, and Realtime voice as provider substrates behind Blackstage-owned approvals, traces, and render objects.

## What Codex Did Well

- Preserved the local-only default while making assistant speech visible and testable.
- Kept Realtime voice as a live-provider boundary instead of putting API keys in the browser.
- Added e2e coverage for browser speech synthesis with a mocked `speechSynthesis` implementation.
- Updated the completion audit so the remaining gap is specifically live Realtime, not speech output in general.

## What Failed Or Needed Human Intervention

- No human intervention was required for this slice.
- Live Realtime, Codex worker, and Agents SDK execution remain intentionally deferred behind adapter boundaries.

## Product Insight

Sparse spoken confirmations feel more appropriate for Blackstage than continuous narration. The stage should speak at transitions: ready, intent received, approval resolved, and harness started.

## AI-Building Insight

The useful architecture is provider-backed but Blackstage-owned: Codex/Symphony can operate the background labor loop, while Stage events remain the product truth.

## Evidence

- Stage voice toggle added to the intent capture surface.
- `assistant.speech` events are logged into local research instrumentation.
- Validation commands are recorded in the completion audit after the slice gate.
