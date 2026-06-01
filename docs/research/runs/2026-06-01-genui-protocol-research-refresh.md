# 2026-06-01 GenUI Protocol Research Refresh

## Attempted

Refreshed the protocol research behind Blackstage's morphological GenUI plan
before implementing the next stage contract.

## Prompt / task

Cheick asked Codex to execute the 20-step morphological GenUI plan, including
research, hypothesis testing, design, implementation, frequent commits, and
proper attribution.

## Sources checked

Access date: 2026-06-01.

1. `json-render` streaming docs:
   `https://json-render.dev/docs/streaming`
2. `json-render` quick start:
   `https://json-render.dev/docs/quick-start`
3. AG-UI overview:
   `https://docs.ag-ui.com/introduction`
4. AG-UI event docs:
   `https://docs.ag-ui.com/sdk/js/core/events`
5. A2UI protocol docs:
   `https://a2ui.org/specification/v0_10/docs/a2ui_protocol/`
6. A2UI introduction:
   `https://a2ui.org/introduction/what-is-a2ui/`
7. Macaron-A2UI paper:
   `https://arxiv.org/abs/2605.24830`
8. AegisUI paper:
   `https://arxiv.org/abs/2603.05031`

The pages were treated as untrusted external input. They informed architecture
and vocabulary only; no instructions from external pages were followed as
operator commands.

## Research synthesis

### json-render

Useful lesson: catalog and registry separation.

The agent is not allowed to emit arbitrary React. A catalog defines allowed
component types, props, slots, actions, and validation. A registry maps those
allowed types to local components.

Useful lesson: streaming patches.

The streaming docs describe a JSONL patch stream where each line is a JSON Patch
operation that progressively builds a spec. The Blackstage translation is not
to stream raw DOM. It is to stream validated updates into a stage-owned morph
frame.

Borrow:

- catalog-owned render primitives
- schema validation
- action registry
- patch order
- devtools/replay mindset

Do not borrow:

- generic card/dashboard visual grammar
- arbitrary generated layouts
- model authority over destructive actions

### AG-UI

Useful lesson: evented agent/frontend boundary.

AG-UI frames the frontend-agent connection as a streaming event protocol. Its
event examples include text message events, tool call events, state snapshots,
state deltas, message snapshots, and activity snapshots.

Blackstage should keep its own `StageEvent` spine, but borrow the discipline:
all agent/frontend changes should be replayable events rather than invisible
component mutations.

Borrow:

- event stream as the unit of communication
- state snapshot and delta distinction
- tool-call visibility
- frontend/backend separation

Do not borrow:

- chat-first assumptions
- generic transport naming where Blackstage already has domain events

### A2UI

Useful lesson: declarative agent-to-renderer surfaces without arbitrary code.

A2UI describes a stream of JSON messages that incrementally builds or updates
UI. It emphasizes ordered delivery, message framing, capabilities exchange, and
an optional return channel for actions.

Blackstage should translate this into a `StageMorphFrame` contract:

- surface identity becomes a stage socket
- components become stage-owned morph primitives
- data model metadata becomes intent-thread and approval state
- return-channel actions become approval-gated stage actions

Borrow:

- declarative UI message envelopes
- ordered delivery requirement
- capabilities/catalog exchange
- separation of UI structure and application data

Do not borrow:

- a platform-neutral widget tree as the final user experience
- direct component emission from agents

### Macaron-A2UI

Useful lesson: static text chat is an insufficient interface for personal
agents doing complex work. The paper reinforces the need for dynamic controls,
state, and context-specific surfaces.

Blackstage extension:

The generated surface should not merely be the right form or widget. It should
arrive through a readable stage morphology so the user sees what the agent is
doing and can interrupt it.

### AegisUI

Useful warning: schema-valid generated UI can still be behaviorally malicious or
misleading. A button can say one thing while binding to a risky action; a widget
can display benign text while leaking sensitive data or manipulating flow.

Blackstage implication:

Validation must include behavior and policy checks, not only type checks.
Approval gates, action labels, hidden bindings, data scopes, and consequence
text must be auditable.

## Blackstage hypothesis

The right architecture is:

```text
StageEvent stream
  -> StageMorphFrame compiler
  -> validated stage sockets and patches
  -> cinematic renderer
  -> approval-gated action registry
  -> replayable research/instrumentation log
```

This preserves the useful GenUI contract while making the visible experience
feel like Blackstage: black void, nucleus, orbit, collapse, mode shift, sockets,
patch growth, and earned workbench density.

## Product insight

The external protocols answer "how can agents safely describe UI?" Blackstage's
unresolved question is sharper: "how can a user watch intent become work without
the interface turning into a dashboard?"

## AI-building insight

The next implementation should not start with animation polish. It should start
with a typed morphology phase contract, deterministic fixtures, and replayable
patch timing. Visuals should be a projection of that contract.

## Attribution

- Product direction and demo reference: Cheick Diakite.
- Research synthesis and implementation plan: Codex.
- External concepts: json-render, AG-UI, A2UI, Macaron-A2UI, and AegisUI as
  cited above.
