# 05 System Architecture

## Architecture principle

Blackstage should be built as an event-driven cognitive interface.

The UI should not be hardcoded as static screens. It should render from a structured model of intent threads, stage objects, agent events, approvals, and artifacts.

## Initial architecture

```text
User voice/text
   ↓
Intent capture
   ↓
Intent parser / planner
   ↓
Intent thread state
   ↓
Stage scene manifest
   ↓
Living render field UI
   ↓
Agent runtime + artifact system + approvals
   ↓
Event log + research instrumentation
```

## Recommended v0 stack

Use the simplest stack that lets Codex move quickly:

- TypeScript.
- React.
- Browser-based app for Stage Shell v0.
- Lightweight state management.
- Local persistence at first.
- Event schema package.
- Mock/simulated agent runtime before real tool integrations.
- Later desktop wrapper only after the stage experience is proven.

## Agentic harness direction

Stage Shell v0 should remain simulation-first, but the path from simulation to real background labor is now captured in `docs/21_agentic_harness_architecture.md`.

The intended split is:

- Stage Shell stays the living control surface.
- `voice-core` owns Realtime session, broker, WebRTC, server-event parsing, and Stage event mapping contracts.
- Stage Web can invoke the Realtime SDP bridge only when explicitly configured by local runtime/env settings, a local approval phrase, and a visible operator approval inside the stage.
- `agent-runtime` grows a Symphony-inspired scheduler and adapter contracts.
- Root `WORKFLOW.md` owns the background harness policy, and `HarnessWorkflowPolicy` exposes that policy to the local runner and control-plane snapshot.
- Codex handles coding execution in isolated workspaces.
- OpenAI Agents SDK handles product/research agents that need handoffs, guardrails, human review, tracing, or voice workflows; memory access defaults to redacted summaries and requires Stage approval for inspection, writes, or deletes.
- All live work streams auditable stage events back into the render field.

## Monorepo structure

```text
apps/
  stage-web/
    src/
      app/
      components/
      fixtures/
      routes/
      styles/
  stage-desktop/
packages/
  stage-core/
    src/
      domain/
      events/
      fixtures/
      schemas/
  stage-ui/
    src/
      components/
      motion/
      theme/
  agent-runtime/
    src/
      tasks/
      approvals/
      simulators/
      tool-adapters/
  voice-core/
    src/
      capture/
      transcript/
      realtime/
  memory-core/
    src/
      stores/
      retrieval/
      policies/
docs/
research/
templates/
```

## Domain model

### StageSceneManifest

The render field should not derive organization intelligence from scattered CSS
selectors. `IntentThread` compiles into a `StageSceneManifest` that describes
the cinematic state of the stage:

- ambient state
- layout mode
- camera depth, tilt, parallax, and focal object
- substrate material, liquidity, bloom, and grain
- object roles, clusters, materials, contours, and motion cues
- stage-space object coordinates, depth, scale, and tilt
- semantic zones for intent ingress, work focus, evidence orbit, approval
  threshold, and artifact output
- semantic edges between intent, evidence, approvals, and artifacts

This is the Blackstage-specific equivalent of a guarded render spec. It keeps
dynamic rendering replayable and auditable while allowing the visual layer to
become much more fluid.

### StageSceneField

Stage Web renders the manifest through `StageSceneField`, a non-interactive SVG
and CSS field layer behind the readable DOM objects. The field draws semantic
zone bands, cluster halos, a focal stage floor, horizon energy, relationship
paths, and a soft flow spine through the active zones while documents,
approvals, artifacts, and controls remain accessible DOM surfaces above it.

The current field uses semantic stage-space coordinates and active zones from
the manifest so the active surface behaves like a cinematic scene instead of a
CSS grid. The next renderer upgrade should bind edges to measured object
geometry after layout so the vector layer feels physically attached to the
objects it explains.

Control-bearing objects stay on a 2D DOM plane for reliable hit testing. Depth
is represented by manifest scale, halos, vector relationships, floor rings, and
material treatment rather than by CSS 3D transforms on interactive cards.
Likewise, active command controls use stable geometry so voice startup and
artifact actions remain reachable while the render field animates.

### StageRitualField

`StageRitualField` is the central ritual/labor layer above `StageSceneField`
and below the interactive DOM object surfaces. It reads only serialized
`IntentThread` state: recent `AgentEvent` records and the latest
`ApprovalRequest`.

The layer renders visible labor as a quiet geometric orbit and mirrors a pending
or approved request as an approval threshold in the field. It does not own the
approval action. The right-rail `ApprovalCard` remains the single explicit
button surface for approve/reject/ask-why, which keeps high-impact action
semantics auditable while the field itself becomes more cinematic and
organized.

When an approval is pending, Stage Web derives a single approval-focus object
from the serialized thread and scene manifest. The focus target remains a normal
`StageObject`; no extra approval state is stored. The renderer dims surrounding
objects and draws a non-interactive tether from the focus target to the central
threshold so the approval is visually attached to the object/action being
reviewed.

Browser and e2e geometry checks guard this layer against covering the focal work
object, the command dock, or other readable objects.

### IntentThread

```ts
type IntentThread = {
  id: string;
  title: string;
  originalIntent: string;
  currentObjective: string;
  status: "active" | "paused" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
  contextSummary?: string;
  renderObjects: StageObject[];
  agentEvents: AgentEvent[];
  artifacts: Artifact[];
  approvals: ApprovalRequest[];
  memoryNotes: MemoryNote[];
  decisions: DecisionRecord[];
  researchSessionId?: string;
};
```

Artifact surfaces are ordered by artifact timestamps for active workbench focus.
This keeps replayed or late old draft events from stealing focus away from a
newer approved or exported artifact.

### StageObject

```ts
type StageObject = {
  id: string;
  threadId: string;
  type:
    | "intent_card"
    | "plan_card"
    | "agent_feed"
    | "artifact_card"
    | "approval_card"
    | "risk_matrix"
    | "timeline"
    | "table"
    | "chart"
    | "browser_portal"
    | "document_portal"
    | "code_diff"
    | "research_note";
  title: string;
  summary?: string;
  payload: unknown;
  position?: { x: number; y: number; z?: number };
  size?: { width: number; height: number };
  state: "collapsed" | "expanded" | "focused" | "hidden";
  createdAt: string;
  updatedAt: string;
};
```

### AgentEvent

```ts
type AgentEvent = {
  id: string;
  threadId: string;
  taskId?: string;
  agentName: string;
  type:
    | "planned"
    | "started"
    | "progress"
    | "completed"
    | "failed"
    | "blocked"
    | "approval_requested"
    | "cancelled";
  summary: string;
  details?: string;
  evidence?: EvidenceRef[];
  timestamp: string;
};
```

### ApprovalRequest

```ts
type ApprovalRequest = {
  id: string;
  threadId: string;
  actionType:
    | "external_message"
    | "file_write"
    | "file_delete"
    | "purchase"
    | "calendar_action"
    | "data_share"
    | "network_access"
    | "code_execution"
    | "credential_use";
  title: string;
  summary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  proposedBy: string;
  scope: string;
  consequence: string;
  undoPath?: string;
  status: "pending" | "approved" | "rejected" | "edited" | "expired";
  createdAt: string;
  resolvedAt?: string;
};
```

### Artifact

```ts
type Artifact = {
  id: string;
  threadId: string;
  type:
    | "memo"
    | "plan"
    | "brief"
    | "table"
    | "model"
    | "diagram"
    | "code"
    | "design"
    | "research_note";
  title: string;
  status: "draft" | "review" | "approved" | "exported";
  contentRef?: string;
  content?: unknown;
  provenance: EvidenceRef[];
  createdAt: string;
  updatedAt: string;
};
```

### ResearchEvent

```ts
type ResearchEvent = {
  id: string;
  sessionId: string;
  threadId?: string;
  eventType:
    | "intent_submitted"
    | "render_object_created"
    | "agent_event"
    | "approval_requested"
    | "approval_resolved"
    | "artifact_created"
    | "user_intervention"
    | "codex_task_started"
    | "codex_task_completed"
    | "research_note_created";
  payload: unknown;
  timestamp: string;
};
```

## Event-driven rendering

Instead of hardcoding UI paths, create stage events:

```ts
type StageEvent =
  | { type: "intent.submitted"; payload: IntentPayload }
  | { type: "thread.created"; payload: IntentThread }
  | { type: "object.created"; payload: StageObject }
  | { type: "agent.progress"; payload: AgentEvent }
  | { type: "approval.requested"; payload: ApprovalRequest }
  | { type: "artifact.created"; payload: Artifact };
```

The stage subscribes to events and updates its render manifest.

## Render manifest

A render manifest is the current layout/intention state of the stage.

```ts
type StageRenderManifest = {
  threadId: string;
  focusObjectId?: string;
  objects: StageObject[];
  ambientState: "idle" | "listening" | "thinking" | "working" | "approval_needed";
  layoutMode: "centered" | "constellation" | "focused" | "artifact";
};
```

## Agent runtime

For v0, build a simulated agent runtime.

Why simulation first:

- It lets the team perfect the UX.
- It avoids tool complexity before the interaction model is proven.
- It creates demo fixtures.
- It makes research instrumentation easier.

Later agent runtime layers:

1. Simulated tasks.
2. LLM-generated plans and artifacts.
3. Tool-backed web/file/code tasks.
4. Computer-use tasks.
5. Multi-agent orchestration.
6. External integrations.

## Persistence

V0:

- Store intent threads in browser local storage or lightweight local DB.
- Store fixtures in code.
- Store research logs locally/exportable.

Later:

- Local-first encrypted storage.
- Cloud sync.
- Team/project workspaces.
- Memory vault.
- Audit log storage.

## API boundaries

Keep these boundaries clean:

- UI never directly performs risky actions.
- Agent runtime creates approval requests before risky actions.
- Memory writes go through memory policy.
- Research logging strips sensitive content by default.
- Artifact creation records provenance.

## Testing strategy

### Unit tests

- Domain models.
- Event reducers.
- Approval risk classification.
- Render manifest generation.
- Memory policy behavior.

### Component tests

- StageRoot renders expected objects.
- ApprovalCard states.
- AgentActivityFeed states.
- ArtifactCard states.

### End-to-end tests

- User submits intent.
- Thread is created.
- Objects render.
- Agent events stream.
- Approval appears.
- Artifact is created.
- Research event is logged.

### Visual tests

- Screenshot fixtures for North Star demo.
- Check dark stage visual integrity.

## Architecture risks

- Building full OS too early.
- Hardcoding demo instead of building real primitives.
- Making UI too generic.
- Letting agent runtime become untestable.
- Adding memory before privacy policy is clear.
- Treating research logging as an afterthought.
