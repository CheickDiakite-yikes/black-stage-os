# 27 Live Voice Test Protocol

Status: Operator runbook
Date: 2026-05-11

## Purpose

This is the first practical live-session loop for Blackstage: click the center
orb, open the brokered Realtime edge, optionally attach the microphone, speak,
watch the stage render work, approve a safe tool action, then export redacted
debug evidence.

The default repo state stays local and cheap. Live OpenAI calls run only when a
local shell is armed, and microphone audio is sent only when the browser path is
explicitly enabled and approved.

## What Is Real Now

- The startup UX begins on the idle living field with `Speak when ready`; the
  user clicks the orb to start.
- Stage Web can connect to the local `stage-broker` through a brokered WebRTC
  SDP exchange without exposing the standard OpenAI API key to the browser.
- The no-mic live smoke sends a data channel plus `recvonly` audio offer and is
  capped by the cheap guard.
- Realtime provider text can render into the Stage assistant speech surface.
- Realtime provider tool calls for `blackstage_prepare_external_action` become
  Stage approval cards.
- Stage Web registers that safe tool on the Realtime session as soon as the
  data channel opens, so a human mic run can ask for an approval-gated action
  without relying on a synthetic probe.
- Approving the tool card runs the safe local
  `blackstage.prepare_external_action` adapter, creates visible stage work and a
  review artifact, and sends a `function_call_output` item back over the
  existing data channel when it is writable.
- The Research Trace can export a redacted Realtime debug packet with event
  counts, tool-call/output evidence, audio lifecycle counts, first-latency
  markers, elapsed timing, and bridge/mic state. It does not store raw provider
  payloads, raw audio, transcripts, SDP, API keys, or approval phrases.

## Cheap Baseline

Run these before any manual voice session:

```bash
pnpm preflight:realtime
pnpm prepare:realtime-smoke
pnpm prepare:live-voice
```

`pnpm prepare:realtime-smoke` prints local export lines for the live-smoke flag,
safety identifier, approval token, redacted proof path, and 15-second timeout.
It does not print `OPENAI_API_KEY` and does not make a network call.

`pnpm prepare:live-voice` prints the manual two-terminal broker and Stage Web
commands for no-mic, no-mic-plus-tool-probe, and microphone testing. It writes no
env file, prints no API key, starts no provider call, and starts no microphone
stream by itself.

Then run the no-mic UI proof:

```bash
pnpm smoke:realtime-ui
```

Expected result:

- the browser clicks the startup orb;
- the live Realtime approval opens;
- the no-mic SDP exchange succeeds;
- provider text appears in the Stage speech surface;
- provider tool-call output becomes an approval card;
- the proof records no microphone send and no browser API-key exposure.

## Manual No-Mic Tool Proof

Use this when you want to see the live edge in the actual UI without sending
microphone audio.

Terminal A, start the broker:

```bash
set -a
[ -f .env.local ] && . ./.env.local
set +a

export BLACKSTAGE_REALTIME_LIVE=1
export BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER=blackstage-local-test
export BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN=choose-a-local-phrase
export BLACKSTAGE_BROKER_ALLOWED_ORIGINS=http://127.0.0.1:4187,http://localhost:4187
pnpm dev:broker
```

`OPENAI_API_KEY` may stay in `.env.local`, but the broker shell still needs the
variable loaded before `pnpm dev:broker` starts. Do not paste the key into chat
or commit it.

Terminal B, start Stage Web:

```bash
VITE_BLACKSTAGE_REALTIME_BROKER_URL=http://127.0.0.1:8798 \
VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED=1 \
VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN=choose-a-local-phrase \
VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED=0 \
VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED=1 \
pnpm --filter @blackstage/stage-web dev --host 127.0.0.1 --port 4187
```

Open `http://127.0.0.1:4187`, click the orb, approve the live Realtime edge,
and watch for `live SDP` plus Realtime debug counts in Research Trace.

To push the function-calling path during this no-mic run, add probe prompts to
the Stage Web command:

```bash
VITE_BLACKSTAGE_REALTIME_BROKER_URL=http://127.0.0.1:8798 \
VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED=1 \
VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN=choose-a-local-phrase \
VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED=0 \
VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED=1 \
VITE_BLACKSTAGE_REALTIME_TEXT_PROBE="Say one short sentence about what Blackstage is doing." \
VITE_BLACKSTAGE_REALTIME_TOOL_PROBE="Prepare a safe external action brief for requesting diligence materials. Use the available tool." \
pnpm --filter @blackstage/stage-web dev --host 127.0.0.1 --port 4187
```

When the approval card appears, approve it. Expected result: a local tool-result
object and editable review artifact appear, and the Realtime debug export shows
`toolCallObserved` and `toolOutputReturned`.

## Manual Microphone Session

Use this for the real "click orb, speak, and interact" pass.

Start the broker as above. Start Stage Web with audio enabled:

```bash
VITE_BLACKSTAGE_REALTIME_BROKER_URL=http://127.0.0.1:8798 \
VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED=1 \
VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN=choose-a-local-phrase \
VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED=1 \
VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED=1 \
pnpm --filter @blackstage/stage-web dev --host 127.0.0.1 --port 4187
```

Then:

1. Open `http://127.0.0.1:4187`.
2. Confirm the first screen says `Speak when ready` with only the living field
   and orb.
3. Click the orb.
4. Approve the live Realtime edge.
5. Approve the browser microphone prompt.
6. Speak a concrete intent, such as: "Help me decide whether to acquire this
   company and prepare the first diligence memo."
7. Ask it to prepare a safe external action, such as: "Prepare an outreach
   request for diligence materials, but do not send anything without approval."
8. Approve the Stage tool card if it appears.

## Debug Evidence To Export

After the session:

- In Research Trace, click `Export debug` if the Realtime debug block is
  visible.
- Also click `Export JSON` for the normal session trace.
- Save a screenshot if rendering, spacing, object layout, or the startup feel
  looks off.

Send back:

- Realtime debug JSON.
- Session trace JSON.
- Screenshot, if the rendering needs review.
- Five quick notes: time to listening, time to first response, whether a tool
  approval appeared, whether approved tool output rendered, and any audio
  glitch.

## Pass Criteria

The live test is a pass when:

- the first viewport has no demo tabs or scenario buttons;
- the orb is the obvious startup action;
- clicking the orb leads to live approval and then listening;
- speech creates or updates an intent thread;
- provider speech or text appears on the stage without chat chrome;
- at least one provider tool call becomes an approval;
- approval creates visible local work and an artifact;
- the debug export shows the session-level safe tool registration;
- debug export records first-response, tool-call, tool-output, and audio timing
  evidence without raw payloads.

## Known Gaps

- Human-tested live microphone sessions are not yet validated.
- The first safe local Realtime tool exists, but broader tool routing is still
  intentionally narrow.
- The provider tool-call output return path is covered in browser e2e and should
  be verified in a human-run live session.
- Long-lived voice stability, interruption handling, and richer rendering under
  extended sessions still need live feedback.
