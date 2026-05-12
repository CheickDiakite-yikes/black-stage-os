# Session Tool Registration Live Smoke

Date: 2026-05-11

## What Was Attempted

Run the cheap armed no-mic Stage Web Realtime smoke after adding session-level
safe tool registration.

## Prompt Given To Codex

Continue toward live testing and confirm the safe function-calling path can
survive a real provider edge without sending microphone audio.

## What Codex Did Well

- Ran `pnpm smoke:realtime-ui` with shell-only live arming and the local
  `.env.local` OpenAI key.
- Kept the smoke capped at 15 seconds and no microphone send.
- Confirmed the browser received no standard API key.
- Confirmed provider text rendered in the Stage speech surface.
- Confirmed provider tool-call arguments became a Stage approval proof.
- Confirmed the debug summary included `session.update`,
  `blackstage.data_channel.open`, and the
  `blackstage_prepare_external_action` tool name.

## What Failed Or Needed Human Intervention

No human intervention was needed for the no-mic smoke. A human microphone run is
still required for the real startup voice loop.

## Product Insight

This is the strongest pre-human-test signal so far: the first safe tool is now
available at session open and the real provider edge accepts the flow without
browser credentials or microphone audio.

## AI-Building Insight

The distinction between no-mic live proof and human mic proof is now crisp. The
technical provider/tool path is ready enough; the next uncertainty is real voice
UX, latency perception, and rendering under live speech.

## Evidence

- Command: `pnpm smoke:realtime-ui` with shell-only live arming.
- Redacted proof path: `.blackstage/realtime-smoke/session-tool-registration-latest.json`
- Screenshot path: `.blackstage/realtime-smoke/ui-live-2026-05-12T00-05-49-526Z.png`
