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
| Realtime voice foundation | `voice-core` defaults to `gpt-realtime-2`, keeps simulation mode by default, and defines a server-mediated WebRTC broker plan, trusted-server request envelope, framework-neutral broker route handler, and Realtime-to-Stage event mapper with safety identifier checks | Contract only |
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
| Memories | Local memory vault supports proposed/approved/rejected/deleted records, redacted inspection payloads, serializable snapshots, and Stage approval-gated `remember` / `forget` commands | Covered locally |
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
| Background agentic harness | `agent-runtime` scheduler, harness projection, Realtime voice contracts, dry-run Codex worker envelope, disabled local Codex runner seam, dry-run Agents SDK manager plan, internal Symphony control-plane projection, architecture doc | Local simulation/contracts only |
| Live Codex worker | Dry-run envelope and disabled-by-default local `codex exec` command plan exist; no real Codex subprocess/App Server execution yet | Contract only |
| Live Agents SDK worker | Dry-run manager-agent plan exists with specialists as tools and approval-gated memory inspection; no live Agents SDK execution yet | Contract only |
| Live Realtime session | Trusted-server WebRTC request envelope, route handler, and event mapper exist, but no route is mounted in an app server, no client connects to it, and no live API session runs yet | Contract only |
| External integrations | No email/calendar/browser/computer/file-write integrations beyond local simulated/export behavior | Missing by design |

## Evidence From Current Gate

Most recent full validation after the Realtime broker route handler seam:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed with 14 voice-core subtests, 4 memory-core subtests, and 13 agent-runtime subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.
- `pnpm scan:secrets`: passed after the Realtime broker route handler seam.

## Gaps That Block Goal Completion

The goal is not complete yet. The largest remaining gaps are:

1. Live Realtime voice is not connected. The contract, trusted-server request envelope, route handler, and Stage event mapper exist, and local browser-native assistant speech works, but there is no mounted server route, browser client connection, or live Realtime session.
2. Live agentic work is not connected. Codex, Agents SDK, and Symphony-inspired orchestration are represented by local contracts and fixtures, not live workers.
3. Browser, map, model, document, memory, and simulation objects are still simulated or local-only; they are not live controllable portals.
4. Artifact action is still simulated. The user can edit/approve/export, but cannot safely act on artifacts through a real approved external workflow.
5. Multimodal context is shallow. Attachments become local document objects, but image understanding and richer context parsing are not implemented.
6. Speech correction is incomplete. Typed object commands work; spoken follow-up manipulation needs a dedicated reliable path.
7. Memory is local-only. It now has approval-gated write/delete semantics and redacted inspection, but no retrieval ranking, cross-thread review UI, or live agent memory policy enforcement yet.
8. The current visual proof is a browser prototype, not yet a full "computer disappears" environment.

## Next Highest-Leverage Slice

Build the first mounted live-provider bridge while keeping simulation as the default:

- Mount the disabled-by-default Realtime broker route handler behind a local server entrypoint.
- Keep the browser client on SDP-only Realtime exchange, with no standard API key or safety identifier exposed.
- Connect Realtime text/audio/tool events into the existing Stage event log.
- Preserve the Codex/Symphony/Agents SDK harness as background labor behind Blackstage-owned approvals.
- Add contract and e2e coverage proving live mode is explicitly configured, labeled, and still replayable.

This moves the prototype toward real directed intelligence without putting long-lived API keys in the browser or letting external tools bypass the stage.

Status: Not started. The route handler contract is implemented, and the local `Run harness` control is implemented; mounted Realtime server wiring, live Codex, live Agents SDK, Symphony-backed scheduling, and client Realtime session wiring remain incomplete.
