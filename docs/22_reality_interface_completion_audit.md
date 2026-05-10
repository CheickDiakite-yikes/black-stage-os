# 22 Reality Interface Completion Audit

Date: 2026-05-10
Status: Not complete

## Objective Restated As Deliverables

Blackstage is complete only when the repo can demonstrate a working reality interface that:

1. Begins as a calm black living render field.
2. Accepts natural voice, text, and multimodal precision input.
3. Turns intent into a persistent intent thread.
4. Dynamically forms documents, models, maps, browsers, timelines, simulations, memories, approvals, agent activity, and final artifacts.
5. Shows visible, auditable, interruptible, non-noisy agent labor.
6. Gates high-impact actions behind explicit human approval.
7. Lets the user manipulate outputs through speech, text, gesture, and correction.
8. Ends in usable artifacts the user can edit, approve, export, or act on.
9. Preserves the calm, cinematic, non-chatbot, non-dashboard Black Stage feeling.
10. Has instrumentation and build evidence from day one.
11. Provides a path from simulation into a real background agentic harness.

## Prompt-To-Artifact Checklist

| Requirement | Current evidence | Status |
|---|---|---|
| Calm black living field | `apps/stage-web/src/components/StageShell.tsx`, `apps/stage-web/src/styles/global.css`, `artifacts/screenshots/stage-shell-v0.png` | Covered for v0 |
| Begins empty | E2e asserts idle presence says `Speak when ready` in `apps/stage-web/tests/stage-shell.spec.ts` | Covered |
| Text precision | `intent-input` flow in `StageShell.tsx`; e2e submits text commands and scenarios | Covered |
| Natural voice input | Web Speech path in `StageShell.tsx`; mocked browser speech e2e | Covered for browser prototype |
| Realtime voice foundation | `voice-core` defaults to `gpt-realtime-2`, keeps simulation mode by default, and now defines a server-mediated WebRTC broker plan with safety identifier checks | Contract only |
| Assistant speech output | Stage voice toggle speaks sparse browser-native status, shows the last spoken line, and records `assistant.speech` research events | Covered locally |
| Multimodal precision | File attach creates local document objects; image files are accepted as context metadata | Partial |
| Intent thread | `IntentThread`, local persistence, session export/replay | Covered for v0 |
| Dynamic object formation | Scenario fixtures and evented object creation stream objects over time | Covered for v0 |
| Documents | `document_portal` and local context attachment | Simulated/local portal |
| Models | `model_card` surfaces after approval | Simulated |
| Maps | `map_portal` surfaces after approval | Simulated |
| Browsers | `browser_portal` validation lane | Simulated |
| Timelines | `timeline` harness recorder | Covered as local fixture |
| Simulations | `simulation_card` demo simulator | Simulated |
| Memories | `memory_card` and memory boundary surfaces | Placeholder/policy only |
| Approvals | `ApprovalCard`, approval resolution events, ask-why/reject/approve controls | Covered for v0 |
| Agent activity | `AgentActivityFeed`, simulated runtime, local harness projection | Covered for v0 |
| Interruptibility | Stop/resume path preserves pending events; e2e covers pause/resume | Covered for simulated work |
| Audit/replay | Raw `stageEvents`, redacted `researchEvents`, Replay trace control | Covered locally |
| Artifact creation | Draft and approved artifacts from scenarios | Covered for v0 |
| Artifact edit/approve/export | Artifact workbench edits, approves, and exports Markdown | Covered |
| Act on artifact | No real external action execution; action remains simulated and approval-gated | Missing by design |
| Text manipulation/correction | Deterministic text commands focus, pin, collapse, expand objects | Covered for high-confidence commands |
| Speech manipulation/correction | Voice can submit intent but not yet reliably drive follow-up object commands in a dedicated flow | Partial |
| Gesture/direct manipulation | Focus, pin, collapse, nudge, drag handle | Partial |
| Non-chatbot aesthetics | Screenshot, layout, object field, no chat bubbles/sidebar-dominant shell | Covered for v0 |
| Instrumentation | `researchLogger`, redaction, research trace, run logs under `docs/research/runs/` | Covered locally |
| Background agentic harness | `agent-runtime` scheduler, harness projection, Realtime voice contracts, dry-run Codex worker envelope, disabled local Codex runner seam, internal Symphony control-plane projection, architecture doc | Local simulation/contracts only |
| Live Codex worker | Dry-run envelope and disabled-by-default local `codex exec` command plan exist; no real Codex subprocess/App Server execution yet | Contract only |
| Live Agents SDK worker | No Agents SDK adapter yet | Missing |
| Live Realtime session | No server broker or live API session yet | Missing |
| External integrations | No email/calendar/browser/computer/file-write integrations beyond local simulated/export behavior | Missing by design |

## Evidence From Current Gate

Most recent full validation after the local Codex runner boundary slice:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed with 4 voice-core subtests and 10 agent-runtime subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 8 browser tests.
- `pnpm scan:secrets`: passed after the local Codex runner boundary slice.

## Gaps That Block Goal Completion

The goal is not complete yet. The largest remaining gaps are:

1. Live Realtime voice is not connected. The contract exists and local browser-native assistant speech works, but there is no server broker or live Realtime session.
2. Live agentic work is not connected. Codex and Symphony-inspired orchestration are represented by local contracts and fixtures, not live workers.
3. Browser, map, model, document, memory, and simulation objects are still simulated or local-only; they are not live controllable portals.
4. Artifact action is still simulated. The user can edit/approve/export, but cannot safely act on artifacts through a real approved external workflow.
5. Multimodal context is shallow. Attachments become local document objects, but image understanding and richer context parsing are not implemented.
6. Speech correction is incomplete. Typed object commands work; spoken follow-up manipulation needs a dedicated reliable path.
7. Memory is only a policy surface. There is no durable personal/project memory store with inspect/delete/approval semantics.
8. The current visual proof is a browser prototype, not yet a full "computer disappears" environment.

## Next Highest-Leverage Slice

Build the local harness-to-stage live demo path:

- Add a Stage Shell control to start a local harness run from the current thread.
- Stream harness events into `stageEvents` in real time instead of projecting a static snapshot.
- Keep it simulated and local-only.
- Add e2e coverage proving the harness can be started, blocked by approval, replayed, and inspected.

This moves the prototype closer to real directed intelligence without prematurely adding live API keys, external tools, or background side effects.

Status: Implemented as the `Run harness` visible-labor control. The run is still simulated and local-only; live Codex, Agents SDK, and Realtime wiring remain incomplete.
