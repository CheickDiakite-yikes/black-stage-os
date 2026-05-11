# 21 Agentic Harness Architecture

Status: Directional architecture note
Date: 2026-05-10

## Decision

Blackstage should treat the Stage Shell as the visible control surface and run a separate agentic harness behind it. The harness should combine:

- OpenAI Realtime voice for the voice-native front door.
- OpenAI Agents SDK for product/research agents where Blackstage owns tools, approvals, state, handoffs, and traces.
- OpenAI Codex as the coding execution worker.
- Symphony-style orchestration for long-running work queues, per-task workspaces, retries, and human review.

This is not a replacement for Stage Shell v0. It is the path from simulation to real background labor.

After the 2026-05-10 provider refresh, the stance is: yes, Blackstage should leverage open-source Codex, Symphony, and `gpt-realtime-2`, but only behind Blackstage-owned stage events, approval gates, and replayable traces. Codex/Symphony can power the background labor loop; they should not become the user-facing operating metaphor.

After the 2026-05-11 workflow-policy slice, that stance is also codified in root `WORKFLOW.md` and exposed as typed `HarnessWorkflowPolicy` metadata from the Symphony-style control plane and local harness runner readiness. The policy remains read-only to the browser, keeps live execution disabled by default, and requires Stage approval before background agents inspect, write, or delete memory.

After the 2026-05-11 upstream-matrix slice, `HarnessWorkflowPolicy` also carries a source-pinned integration matrix for Codex CLI, Codex App Server, Agents SDK, Symphony, and `gpt-realtime-2`. The matrix makes each upstream role explicit while keeping browser mutation, browser credential access, and high-impact execution gated by Blackstage.

After the 2026-05-11 open-source-anchor slice, the same policy also carries explicit open-source anchors for Codex and Symphony. This preserves the founder's direction to leverage open-source Codex and Symphony without making either project the foreground UI or bypassing Blackstage approvals.

## Source-Verified Assumptions

- `gpt-realtime-2` is listed as a reasoning model for realtime voice interactions, supports speech-to-speech interaction, configurable reasoning effort, stronger tool use, text/audio/image input, text/audio output, and the `v1/realtime` endpoint. Source: <https://developers.openai.com/api/docs/models/gpt-realtime-2>
- OpenAI's Agents SDK docs say the SDK path is appropriate when the application owns orchestration, tool execution, approvals, and state; the same page points to voice agents as the SDK path for speech-to-speech workflows. Source: <https://developers.openai.com/api/docs/guides/agents>
- The OpenAI Agents SDK JavaScript/TypeScript repo describes agents, sandbox agents, tools, guardrails, human-in-the-loop, sessions, tracing, and realtime agents. Source: <https://github.com/openai/openai-agents-js>
- Codex CLI is OpenAI's local coding agent, is open source, and can inspect a repository, edit files, and run commands in the selected directory. Source: <https://developers.openai.com/codex/cli>
- Codex App Server is OpenAI's programmatic Codex transport for integrating Codex into custom developer workflows and orchestration systems. Source: <https://developers.openai.com/codex/app-server/>
- Symphony is an open-source spec/reference for Codex orchestration where task trackers become a control plane, active tasks get agents, work happens in isolated workspaces, and humans review results. Source: <https://openai.com/index/open-source-codex-orchestration-symphony/>
- Codex and Symphony open-source anchors are carried as typed policy metadata so future workers can inspect official repositories without confusing source availability with permission to execute live work. Sources: <https://github.com/openai/codex>, <https://github.com/openai/symphony>
- OpenAI's current Realtime WebRTC guidance recommends WebRTC for browser/mobile client connections and a developer-controlled server for session creation, with the trusted backend holding the standard API key and setting safety identifiers. Source: <https://developers.openai.com/api/docs/guides/realtime-webrtc>
- OpenAI's Agents SDK orchestration guidance distinguishes handoffs from manager-style agents-as-tools; Blackstage should prefer manager-style ownership for the visible stage, using specialists as bounded capabilities until a branch truly needs delegated ownership. Source: <https://developers.openai.com/api/docs/guides/agents/orchestration>

## Target Layers

### 1. Stage Shell

The Stage Shell remains the black living render field. It owns intent capture, visible agent labor, approvals, artifacts, event replay, and user control. It should not become a task tracker dashboard.

### 2. Realtime Voice Front Door

`voice-core` should grow a Realtime adapter that can stream microphone input, receive audio/text deltas, and emit stage events:

- `intent.submitted`
- `assistant.speech`
- `agent.progress`
- `user.intervention`

Browser clients must not hold long-lived API keys. A later server broker should mint short-lived realtime sessions and enforce voice/tool policy.

Stage Shell may use browser-native speech synthesis as a local prototype affordance before the Realtime adapter is live. That local speech path is product behavior, not a substitute for the Realtime voice provider.

### 3. Intent Compiler

The first model-backed agent should convert voice/text/multimodal context into:

- an `IntentThread`;
- a task graph;
- visible render objects;
- approval requirements;
- artifact expectations.

### 4. Harness Orchestrator

`agent-runtime` should add a Symphony-inspired scheduler:

- reads eligible work from an internal task queue first, not Linear on day one;
- creates deterministic per-task workspaces;
- runs bounded concurrency;
- retries recoverable failures;
- cancels work when the stage or human changes task state;
- streams structured run events back into Stage Shell.

The local service boundary is now mounted in `apps/stage-runner`. It exposes
safe readiness, snapshot, enqueue, and run-next routes over localhost while
keeping browser-origin mutations blocked and keeping Codex/Agents SDK execution
in dry-run mode.

### 5. Codex Execution Adapter

Coding tasks should run through a Codex adapter rather than bespoke shell scripts. The adapter should map Blackstage task briefs into Codex prompts, collect proof of work, run validations, and return artifacts or pull-request-ready diffs. The local runner can use Codex CLI, while larger Symphony-style orchestration should be prepared to hand work to Codex App Server.

The adapter boundary should be:

- input: approved `HarnessTask`, task workspace, stage thread context, and validation command list;
- execution: Codex CLI or Codex App Server in a bounded workspace;
- output: normalized `HarnessEvent` stream, validation evidence, artifact manifests, and optional PR-ready diff metadata;
- refusal/blocking: any workspace escape, unapproved network call, unapproved push, or missing validation proof.

### 6. Agents SDK Adapter

Non-coding workflows should use the Agents SDK when they need handoffs, guardrails, tracing, tools, or human review. Research synthesis, acquisition analysis, memory inspection, and artifact generation fit here better than in the Codex worker.

The first live pattern should keep a Blackstage manager agent in control and expose specialists as tools. Handoffs are reserved for cases where a specialist should truly own the next branch of work.

### 7. Approval And Audit Spine

Every cross-boundary action must produce events before work proceeds:

- filesystem writes outside an approved workspace;
- network calls;
- external account actions;
- memory writes;
- PR creation or push;
- user-visible publication or sending.

The stage event log remains the black-box recorder. Replay should work whether events came from simulation, Realtime voice, Agents SDK runs, or Codex runs.

## First Implementation Slices

1. Add harness contracts in `packages/agent-runtime`:
   - `HarnessTask`
   - `HarnessRun`
   - `HarnessEvent`
   - `HarnessAdapter`
   - in-memory scheduler fixture
   - Status: implemented as a local-only first slice with a simulated adapter and Node tests.

2. Add Realtime voice contracts in `packages/voice-core`:
   - session config type
   - voice event mapping
   - no API key handling yet
   - Status: implemented as a local-only contract with `gpt-realtime-2` defaults, Blackstage-owned sparse-speech instruction contract, simulation mode, server-broker policy, WebRTC broker plan, trusted-server unified WebRTC request envelope, framework-neutral broker route handler, local `apps/stage-broker` server mount, server-side OpenAI Realtime exchange adapter, browser-safe broker readiness probe, disabled-by-default browser SDP exchange adapter, browser microphone preflight that starts no stream, Stage Web visible mic preflight status, Realtime-to-Stage event mapper, safety identifier readiness checks, and tests. No default OpenAI network call or microphone stream runs yet.

3. Add Stage Shell harness fixtures:
   - one simulated background Codex run
   - one blocked approval
   - one completed artifact
   - one replayable failure
   - Status: implemented as local scheduler proof projected into Stage events after the Build BlackStage approval, with button, text, and spoken-command paths into the local harness recorder.

4. Add docs and tests before live API calls:
   - local-only harness test
   - no network by default
   - approval gate coverage
   - research log entry

5. Add provider boundary contracts:
   - dry-run Codex worker envelope
   - approved workspace guard
   - internal Symphony-style control-plane projection
   - Status: implemented as local-only contracts, typed workflow policy metadata, and Node tests; no Codex subprocess, App Server, Linear, or network call runs yet.

6. Add disabled-by-default local Codex runner seam:
   - explicit `codex exec` command plan
   - injected executor only
   - `.blackstage/workspaces/*` boundary
   - `workspace-write` sandbox and `never` approval policy in the worker plan
   - JSON events and ephemeral session flags
   - Status: implemented as a local runner boundary with tests; no real Codex subprocess is launched by default.

7. Add Agents SDK manager-plan contracts:
   - dry-run manager-agent plan for research/artifact/agent tasks
   - specialists exposed as tools
   - handoffs disabled by default
   - memory inspection approval-gated
   - redacted memory summaries by default, with inspection/write/delete behind Stage approval
   - coding work refused so Codex remains the execution worker
   - `pnpm preflight:agents-sdk` reports redacted shell/runtime readiness without starting agents, tools, traces, handoffs, or memory actions
   - Status: implemented as local-only contracts, typed memory-access policy, redacted preflight, and Node tests; no Agents SDK API call runs yet.

8. Mount the local harness runner service:
   - localhost HTTP server in `apps/stage-runner`
   - safe readiness endpoint for Stage Web
   - Symphony-style snapshot projection
   - local enqueue and run-next routes for CLI/server callers
   - browser-origin mutations blocked
   - Codex and Agents SDK remain dry-run only
   - Status: implemented with Node server tests and a Stage Web `Harness edge` status.

9. Add the explicit Codex subprocess boundary:
   - Node `spawn` executor for `codex exec`
   - no shell execution
   - worker prompt written through stdin
   - timeout and output limits
   - only mounted when `BLACKSTAGE_CODEX_SUBPROCESS_ENABLED=1`
   - browser still cannot enqueue work, run Codex, or receive provider credentials
   - Status: implemented with fake-process tests; not enabled by default, and no live Codex subprocess ran during validation.

10. Prepare bounded Codex workspaces:
    - deterministic `.blackstage/workspaces/*` paths
    - local `blackstage-task.json` manifest packets
    - workspace preparation only when explicitly enabled or live Codex subprocess mode is enabled
    - workspace escape rejection
    - `.blackstage/` ignored by git
    - Status: implemented with temp-directory tests; no live Codex subprocess ran during validation.

11. Write run proof packets:
    - local `blackstage-run.json` proof packet after a prepared task runs
    - captures run id, task id, adapter, status, summary, event count, and policy
    - keeps external-action status explicit
    - Status: implemented with temp-directory tests; no live Codex subprocess ran during validation.

12. Expose proof summaries read-only:
    - `GET /api/blackstage/harness/proofs`
    - scans prepared `.blackstage/workspaces/*/blackstage-run.json` packets
    - returns sanitized proof summaries, not raw workspace files
    - Status: implemented with temp-directory tests; browser mutation and execution rights remain blocked.

13. Require explicit local approval before live Codex run-next:
    - `BLACKSTAGE_CODEX_SUBPROCESS_ENABLED=1` is not enough to launch a worker
    - live-mode `POST /api/blackstage/harness/run-next` requires `BLACKSTAGE_CODEX_RUN_APPROVAL_TOKEN`
    - local callers must send the matching `x-blackstage-codex-approval` header
    - denied requests return `403` and leave queued work untouched
    - `pnpm preflight:codex-runner` reports redacted shell readiness without starting the runner or invoking Codex
    - Status: implemented with local server and script tests; no live Codex subprocess ran during validation.

14. Codify the upstream-aligned workflow policy:
    - root `WORKFLOW.md` defines the Blackstage harness control plane, worker split, safety boundaries, evidence expectations, and validation floor
    - `agent-runtime` exports `HarnessWorkflowPolicy`
    - Symphony-style snapshots and `apps/stage-runner` readiness expose the policy without granting browser execution rights
    - source-pinned integration matrix for Codex CLI, Codex App Server, Agents SDK, Symphony, and Realtime voice
    - Status: implemented with agent-runtime, stage-runner, and Stage Web policy tests; no live Codex, Agents SDK, or Realtime network call runs by default.

15. Add the Codex App Server handoff contract:
    - app-server transport in the typed Codex worker envelope
    - Blackstage-owned handoff protocol for approved task packets
    - source-aligned dry-run JSON-RPC sequence for `initialize`, `initialized`, `thread/start`, and `turn/start`
    - browser mutation and provider credential boundaries set to false
    - dry-run scheduler proof that no live transport is armed
    - local runner transport selection with `BLACKSTAGE_CODEX_TRANSPORT=app_server`
    - Status: implemented with agent-runtime and stage-runner tests; no live App Server process or network call runs by default.

## Risks

- Realtime voice can become expensive or noisy if every stage status becomes speech. Default to sparse, high-signal spoken confirmations.
- Symphony is a reference pattern, not something to blindly copy into the product. Blackstage should start with internal task queues before integrating Linear or GitHub Issues.
- Codex workers need strict workspace boundaries, explicit local arming, and visible proof, especially if they can run commands.
- Agents SDK traces and app logs can contain sensitive data. Redaction and storage policy must be explicit before production use.
- The Stage Shell must keep showing agent labor calmly; background orchestration should never degrade into a generic dashboard.

## Near-Term Product Rule

Simulation stays the default demo path. Live OpenAI-backed voice or agents should be introduced behind explicit local configuration and visibly labeled as live.
