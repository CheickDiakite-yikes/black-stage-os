# Reality Interface Audit and Voice Slice

Date: 2026-05-10

## Objective Restated as Success Criteria

The broad Blackstage objective requires a working reality interface where:

- The stage begins as a calm, dark, cinematic living render field.
- The user can direct the system through natural voice, with text precision still available.
- The stage forms intent threads and dynamic objects around intent.
- Object types include documents, models, maps, browsers, timelines, simulations, memories, approvals, agent activity, and final artifacts.
- Agent labor is visible, auditable, and non-noisy.
- Risky actions require elegant approval.
- The user can manipulate outputs through speech, text, gesture, and correction.
- Sessions end in usable artifacts that can be edited, approved, exported, or acted on.
- The experience avoids app chrome, chatbot feel, clutter, and generic dashboard aesthetics.

## Prompt-to-Artifact Checklist

| Requirement | Current evidence | Status |
|---|---|---|
| Calm dark cinematic field | `StageShell`, `global.css`, screenshot `artifacts/screenshots/stage-shell-v0.png` | Covered for v0 |
| Begins empty | Idle thread and empty stage state in `createIdleIntentThread` and StageShell | Covered |
| Natural voice input | New Web Speech API capture in `StageShell`; mocked e2e proof | Improved in this slice |
| Text precision | Intent input and submit flow | Covered |
| Multimodal precision | No image/file/camera/drop input yet | Missing |
| Intent thread | `IntentThread` model, persisted session state, thread console | Covered for v0 |
| Dynamic render objects | Scenario fixtures and `StageObjectCard` rendering | Covered for v0 |
| Documents/models/maps/browsers/timelines/simulations/memories | Timelines, risks, tasks, artifacts, and memory status exist; browser/map/document portals are model types only, not live surfaces | Partially covered |
| Visible non-noisy agent labor | `AgentActivityFeed` and timed simulated runtime | Covered for v0 |
| Elegant risky-action approval | `ApprovalCard`, approval resolution events, e2e assertions | Covered for v0 |
| Speech manipulation/correction | Voice can submit initial intent; follow-up spoken correction commands are not implemented | Partial |
| Gesture/direct manipulation | No drag/pin/focus gesture layer yet | Missing |
| Usable artifact | `ArtifactCard` with draft/approved artifact and export | Covered for v0 |
| Edit artifact | No artifact editor yet | Missing |
| Export artifact/session | Session JSON export covered; artifact-specific export not yet | Partial |
| Act on artifact | Only simulated task/artifact creation; no real external action | Intentionally deferred |
| No generic chatbot feel | Browser screenshot and component structure avoid chat bubbles/sidebar dominance | Covered for v0 |

## Slice Implemented

The next high-leverage missing slice was voice-native intent capture.

Changes:

- Added browser-native Speech Recognition support in `StageShell`.
- Kept typed intent as fallback and source of precision.
- Added live transcript surface under the command bar.
- Added listening visual state on the center presence.
- Auto-submits a final spoken transcript into the existing typed-intent event path.
- Kept audio local to the browser API; no server audio or external agent action was added.
- Added a Playwright test with a mocked `SpeechRecognition`/`webkitSpeechRecognition` constructor.

## Validation Notes

Fast validation after implementation:

- `pnpm typecheck`: passed after fixing a React `useRef` typing issue.
- `pnpm test:e2e`: passed after mocking both `SpeechRecognition` and `webkitSpeechRecognition`.

Final full-gate outcomes are recorded in the final Codex summary for this slice.

Final full-gate outcomes:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed; package tests remain placeholder echoes except e2e.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with two tests, including mocked browser speech final-transcript submission.
- `pnpm scan:secrets`: passed; no high-confidence secrets found.

## Research Insight

Voice is most valuable when it enters the same intent-thread machinery as text, not when it becomes a separate assistant mode. The stage should show that speech is a first-class way to summon the workspace while still letting the user correct the exact intent text.
