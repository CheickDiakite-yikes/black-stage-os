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
| Realtime voice foundation | `voice-core` defaults to `gpt-realtime-2`, keeps simulation mode by default, and defines a server-mediated WebRTC broker plan, trusted-server request envelope, framework-neutral broker route handler, local `apps/stage-broker` server mount, server-side OpenAI Realtime exchange adapter, browser-safe broker readiness probe, disabled-by-default browser SDP exchange adapter, and Realtime-to-Stage event mapper with safety identifier checks | Live adapter gated |
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
| Background agentic harness | `agent-runtime` scheduler, harness projection, Realtime voice contracts, dry-run Codex worker envelope, disabled local Codex runner seam, dry-run Agents SDK manager plan, internal Symphony control-plane projection, local `apps/stage-runner` readiness/snapshot/run/proofs service, disabled Codex subprocess executor boundary, bounded workspace preparation, local run proof packets, Stage Web read-only harness snapshot probe, architecture doc | Local service/contracts only |
| Live Codex worker | Dry-run envelope, disabled-by-default local `codex exec` command plan, explicit Node subprocess executor boundary, `.blackstage/workspaces/*` manifest preparation, `blackstage-run.json` proof writing, and read-only proof summary route exist; no real Codex subprocess/App Server execution ran during validation | Gated adapter only |
| Live Agents SDK worker | Dry-run manager-agent plan exists with specialists as tools and approval-gated memory inspection; no live Agents SDK execution yet | Contract only |
| Live Realtime session | Trusted-server WebRTC request envelope, route handler, local broker server mount, server-side OpenAI Realtime exchange adapter, Stage Web readiness client, disabled browser SDP exchange adapter, and event mapper exist, but Stage Web does not invoke the exchange and no default live API session runs yet | Live adapter gated |
| External integrations | No email/calendar/browser/computer/file-write integrations beyond local simulated/export behavior | Missing by design |

## Evidence From Current Gate

Most recent validation after the local Stage Runner service:

- `pnpm typecheck`: passed across 8 of 9 workspace projects.
- `pnpm lint`: passed.
- `pnpm --filter @blackstage/voice-core test`: passed with 21 Realtime subtests.
- `pnpm --filter @blackstage/agent-runtime test`: passed with 15 harness subtests.
- `pnpm --filter @blackstage/stage-broker test`: passed with 7 local server/exchange subtests.
- `pnpm --filter @blackstage/stage-runner test`: passed with 11 local server/snapshot/run/subprocess-boundary/workspace-preparation subtests.
- `pnpm test`: passed with 21 `voice-core` subtests, 4 `memory-core` subtests, 15 `agent-runtime` subtests, 7 `stage-broker` server/exchange subtests, and 11 `stage-runner` server/snapshot/run/subprocess-boundary/workspace-preparation subtests.
- `pnpm build`: passed across the sorted workspace build.
- `pnpm test:e2e`: passed with 9 browser tests in the reduced-motion validation context.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 192 tracked files after final staging.

Browser validation note: the product keeps its cinematic motion in normal use. Playwright now requests `prefers-reduced-motion: reduce` so the long living-field scenario validates behavior instead of timing out on animation/actionability waits.

## Gaps That Block Goal Completion

The goal is not complete yet. The largest remaining gaps are:

1. Live Realtime voice is not connected to Stage Web beyond readiness and disabled SDP contracts. The contract, trusted-server request envelope, route handler, local broker server mount, server-side OpenAI exchange adapter, browser-safe readiness client, disabled browser SDP exchange adapter, and Stage event mapper exist, and local browser-native assistant speech works, but Stage Web does not invoke SDP exchange and no default live Realtime session runs.
2. Live agentic work is not connected by default. Codex, Agents SDK, and Symphony-inspired orchestration are now represented by local contracts, fixtures, a localhost runner service, a disabled Codex subprocess boundary, bounded workspace preparation, local run proof packets, and read-only proof summaries, not default live workers.
3. Browser, map, model, document, memory, and simulation objects are still simulated or local-only; they are not live controllable portals.
4. Artifact action is still simulated. The user can edit/approve/export, but cannot safely act on artifacts through a real approved external workflow.
5. Multimodal context is shallow. Attachments become local document objects, but image understanding and richer context parsing are not implemented.
6. Speech correction is incomplete. Typed object commands work; spoken follow-up manipulation needs a dedicated reliable path.
7. Memory is local-only. It now has approval-gated write/delete semantics and redacted inspection, but no retrieval ranking, cross-thread review UI, or live agent memory policy enforcement yet.
8. The current visual proof is a browser prototype, not yet a full "computer disappears" environment.

## Next Highest-Leverage Slice

Build the first Stage Web to Realtime SDP bridge while keeping simulation as the default:

- Keep the browser client on SDP-only Realtime exchange, with no standard API key or safety identifier exposed.
- Connect Realtime text/audio/tool events into the existing Stage event log.
- Preserve the Codex/Symphony/Agents SDK harness as background labor behind Blackstage-owned approvals.
- Add contract and e2e coverage proving live mode is explicitly configured, labeled, and still replayable.

This moves the prototype toward real directed intelligence without putting long-lived API keys in the browser or letting external tools bypass the stage.

Status: Not started. The local `apps/stage-broker` route mount, server-side OpenAI exchange adapter, Stage Web readiness client, disabled browser SDP exchange adapter, local `apps/stage-runner` harness service, disabled Codex subprocess boundary, bounded workspace preparation, local run proof packets, read-only proof summaries, Stage Web `Harness edge` readiness/snapshot client, and local `Run harness` control are implemented; Stage Web live exchange invocation, default-live Codex, live Agents SDK, external Symphony-backed scheduling, and full client Realtime session wiring remain incomplete.
