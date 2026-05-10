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

## Source-Verified Assumptions

- `gpt-realtime-2` is listed as a reasoning model for realtime voice interactions, supports speech-to-speech interaction, configurable reasoning effort, stronger tool use, text/audio/image input, text/audio output, and the `v1/realtime` endpoint. Source: <https://developers.openai.com/api/docs/models/gpt-realtime-2>
- OpenAI's Agents SDK docs say the SDK path is appropriate when the application owns orchestration, tool execution, approvals, and state; the same page points to voice agents as the SDK path for speech-to-speech workflows. Source: <https://developers.openai.com/api/docs/guides/agents>
- The OpenAI Agents SDK JavaScript/TypeScript repo describes agents, sandbox agents, tools, guardrails, human-in-the-loop, sessions, tracing, and realtime agents. Source: <https://github.com/openai/openai-agents-js>
- Codex CLI is OpenAI's local coding agent, is open source, and can inspect a repository, edit files, and run commands in the selected directory. Source: <https://developers.openai.com/codex/cli>
- Symphony is an open-source spec/reference for Codex orchestration where task trackers become a control plane, active tasks get agents, work happens in isolated workspaces, and humans review results. Source: <https://openai.com/index/open-source-codex-orchestration-symphony/>

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

### 5. Codex Execution Adapter

Coding tasks should run through a Codex adapter rather than bespoke shell scripts. The adapter should map Blackstage task briefs into Codex prompts, collect proof of work, run validations, and return artifacts or pull-request-ready diffs.

### 6. Agents SDK Adapter

Non-coding workflows should use the Agents SDK when they need handoffs, guardrails, tracing, tools, or human review. Research synthesis, acquisition analysis, memory inspection, and artifact generation fit here better than in the Codex worker.

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
   - Status: implemented as a local-only contract with `gpt-realtime-2` defaults, simulation mode, server-broker policy, and Node tests.

3. Add Stage Shell harness fixtures:
   - one simulated background Codex run
   - one blocked approval
   - one completed artifact
   - one replayable failure

4. Add docs and tests before live API calls:
   - local-only harness test
   - no network by default
   - approval gate coverage
   - research log entry

## Risks

- Realtime voice can become expensive or noisy if every stage status becomes speech. Default to sparse, high-signal spoken confirmations.
- Symphony is a reference pattern, not something to blindly copy into the product. Blackstage should start with internal task queues before integrating Linear or GitHub Issues.
- Codex workers need strict workspace boundaries and visible proof, especially if they can run commands.
- Agents SDK traces and app logs can contain sensitive data. Redaction and storage policy must be explicit before production use.
- The Stage Shell must keep showing agent labor calmly; background orchestration should never degrade into a generic dashboard.

## Near-Term Product Rule

Simulation stays the default demo path. Live OpenAI-backed voice or agents should be introduced behind explicit local configuration and visibly labeled as live.
