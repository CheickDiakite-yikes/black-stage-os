# Spoken Stage Command Slice

Date: 2026-05-11

## Why this slice

The reality-interface goal says the user should manipulate outputs through speech, text, gesture, and correction. Typed object commands already worked, but the repo did not have a dedicated proof that spoken follow-up commands shape existing stage objects instead of only starting a new intent thread.

## Prompt

Continue the Blackstage goal loop and close the weakest spoken-correction gap without turning the interface into a chatbot or dashboard.

## What changed

- Propagated voice-vs-text source from Stage Shell submission into the simulated runtime.
- Scenario `intent.submitted` events now preserve `inputMode: "voice"` for voice-origin intent.
- Stage object command interventions now record `commandInputMode`.
- Research events include redacted command input mode evidence.
- Stage Web gives a calm confirmation after object commands, for example `Collapsed Spec portal.`
- Added a browser e2e proof that spoken `collapse the spec portal` collapses the existing document portal and records a voice command trace.

## Validation

- `pnpm build`: passed across the sorted workspace.
- `pnpm typecheck`: passed across 8 of 9 workspace projects.
- `pnpm lint`: passed.
- `pnpm test`: passed, including `pnpm check:workflow`, 23 `voice-core` subtests, 4 `memory-core` subtests, 15 `agent-runtime` subtests, 9 `stage-broker` subtests, and 13 `stage-runner` subtests.
- `pnpm --filter @blackstage/stage-core typecheck`: passed.
- `pnpm --filter @blackstage/agent-runtime typecheck`: passed.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "spoken final"`: passed with one browser test.
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "spoken correction"`: passed with one browser test.
- `pnpm test:e2e`: passed with 12 browser tests, including spoken final intent and spoken correction command coverage.
- `pnpm smoke:realtime`: passed in default skip-gated mode; no live OpenAI call was made.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 211 tracked files after staging.

## Product insight

Speech feels more like direction when it edits the current stage rather than always creating a new run. A deterministic command path is enough for v0 as long as it is visible and auditable.

## AI-building insight

Voice-origin metadata matters. Without it, later evaluations cannot tell whether a behavior was truly voice-native or merely typed through the same command parser.
