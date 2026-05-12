# Vite Env Realtime Arming Slice

Date: 2026-05-12

## What Was Attempted

Make the manual live-voice startup commands arm Stage Web directly through
`VITE_BLACKSTAGE_*` environment variables, without requiring hidden localStorage
setup.

## Prompt Given To Codex

Continue systematically toward the Blackstage goal, with emphasis on live
interaction, function calling, and rendering quality.

## What Codex Did Well

- Reproduced the startup issue without approving a provider call or sending
  microphone audio.
- Confirmed the stage stayed clean and demo-free, but the pure Vite-env path
  initially stayed in `standby`.
- Changed Stage Web Realtime config reads from dynamic `import.meta.env[...]`
  access to direct `import.meta.env.VITE_*` access so Vite injects the live
  runtime values.
- Re-verified the helper-style command path: the Realtime edge showed
  `live broker`, and clicking the center orb opened the live approval card.

## What Failed Or Needed Human Intervention

No human intervention was needed. The run intentionally stopped before approval,
so no OpenAI provider call or microphone stream was started.

## Product Insight

The first live test cannot depend on hidden setup. The startup promise is:
open the page, see the empty living field, click the orb, and get a clear
approval gate before the system contacts the live edge.

## AI-Building Insight

Browser runtime configuration needs its own proof path. A command can look
correct in docs while the browser still sees an unarmed app if bundler env
access is not written in the shape the dev server injects.

## Evidence

- `apps/stage-web/src/voice/realtimeBrokerReadiness.ts`
- `apps/stage-web/src/voice/realtimeWebrtcBridge.ts`
- `/tmp/blackstage-vite-env-idle.png`
- `/tmp/blackstage-vite-env-approval.png`
