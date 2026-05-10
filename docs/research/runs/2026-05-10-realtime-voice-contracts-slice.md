# Realtime Voice Contracts Slice

Date: 2026-05-10

## Why this slice

The harness direction depends on voice being native without exposing secrets or turning the browser prototype into a live API client too early. This slice adds the local contract for future OpenAI Realtime voice integration while keeping the default path simulated.

## What changed

- Added `gpt-realtime-2` as the default realtime voice model constant.
- Added Realtime session config, network mode, transport, reasoning-effort, modality, and safety-policy types.
- Added a default session builder that starts in `simulation` mode.
- Added safety inspection that requires:
  - a server broker;
  - no long-lived API key in browser clients;
  - stage approval gates for realtime tool calls.
- Extended realtime voice events for assistant speech deltas, final assistant speech, tool-call requests, and errors.
- Replaced the placeholder `voice-core` test command with a Node test covering model defaults and browser safety boundaries.

## Validation

- `pnpm --filter @blackstage/voice-core typecheck`: passed.
- `pnpm --filter @blackstage/voice-core test`: passed with 2 Node subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, including 2 voice-core and 3 agent-runtime subtests.
- `pnpm build`: passed.
- `pnpm scan:secrets`: passed.

## Product insight

Voice should be powerful but sparse. The contract should make live speech possible while preserving the stage as the visible approval and audit surface.

## AI-building insight

Putting the server-broker and approval rules into the type contract now reduces the chance that a later live API slice accidentally puts secrets or tool authority in the browser.
