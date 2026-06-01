import type { ApprovalRequest } from "../domain/ApprovalRequest";
import type { IntentThread } from "../domain/IntentThread";
import type { StageObject, StageObjectType } from "../domain/StageObject";
import type { StageEvent } from "../events/stageEvent";
import type { StageShellScenarioId, TimedStageEvent } from "../fixtures/stageShellScenarios";
import {
  createApprovedScenarioStageEvents,
  createScenarioStageEvents,
  createScenarioThread,
  getStageShellScenario
} from "../fixtures/stageShellScenarios";

export type StageMorphPhaseId =
  | "nucleus_awake"
  | "context_orbit_started"
  | "context_collapsed"
  | "mode_shifted"
  | "sockets_allocated"
  | "patch_applied"
  | "approval_ritual"
  | "workbench_revealed";

export type StageMorphMode =
  | "idle"
  | "planning"
  | "coding"
  | "research"
  | "approval"
  | "artifact"
  | "memory";

export type StageMorphSocketRole =
  | "nucleus"
  | "context"
  | "workspace"
  | "approval"
  | "artifact"
  | "telemetry";

export type StageMorphPatchOp = "add" | "replace" | "bind" | "action" | "phase";

export type StageMorphPatchStatus = "queued" | "streaming" | "applied" | "blocked";

export type StageMorphPhase = {
  id: StageMorphPhaseId;
  label: string;
  order: number;
  completed: boolean;
  active: boolean;
  intensity: number;
  eventCount: number;
};

export type StageMorphVoiceEnvelope = {
  source: "none" | "simulated" | "live";
  energy: number;
  cadence: "silent" | "wake" | "context" | "synthesis" | "reveal";
};

export type StageMorphNucleus = {
  id: string;
  label: string;
  mode: StageMorphMode;
  status: "idle" | "listening" | "digesting" | "generating" | "awaiting_approval" | "revealed";
  energy: number;
  voice: StageMorphVoiceEnvelope;
};

export type StageMorphOrbitObject = {
  id: string;
  sourceObjectId: string;
  label: string;
  role: "intent" | "context" | "evidence" | "tool" | "artifact";
  sourceType: StageObjectType;
  angle: number;
  distance: number;
  weight: number;
  status: "incoming" | "orbiting" | "digesting" | "resolved";
};

export type StageMorphSocket = {
  id: string;
  role: StageMorphSocketRole;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: "empty" | "filling" | "resolved" | "blocked";
  patchPath: string;
};

export type StageMorphPatch = {
  id: string;
  op: StageMorphPatchOp;
  path: string;
  label: string;
  phaseId: StageMorphPhaseId;
  source: StageEvent["type"];
  order: number;
  status: StageMorphPatchStatus;
};

export type StageMorphCamera = {
  mode: "void_center" | "orbit_field" | "digest_focus" | "socket_table" | "workbench_tilt";
  tilt: number;
  depth: number;
  focusX: number;
  focusY: number;
};

export type StageMorphApprovalRitual = {
  approvalId: string;
  title: string;
  riskLevel: ApprovalRequest["riskLevel"];
  actionType: ApprovalRequest["actionType"];
  consequence: string;
  status: ApprovalRequest["status"];
};

export type StageMorphWorkbench = {
  state: "hidden" | "allocating" | "patching" | "revealed";
  density: number;
  primarySocketId?: string;
};

export type StageMorphFrame = {
  id: string;
  threadId: string;
  title: string;
  mode: StageMorphMode;
  activePhaseId: StageMorphPhaseId;
  phases: StageMorphPhase[];
  nucleus: StageMorphNucleus;
  orbit: StageMorphOrbitObject[];
  sockets: StageMorphSocket[];
  patches: StageMorphPatch[];
  camera: StageMorphCamera;
  approvalRitual?: StageMorphApprovalRitual;
  workbench: StageMorphWorkbench;
  updatedAt: string;
};

export type StageMorphFixtureId =
  | "planning_task"
  | "code_task"
  | "approval_artifact_task";

export type StageMorphFixtureFrame = {
  id: string;
  delayMs: number;
  event: StageEvent;
  frame: StageMorphFrame;
};

export const stageMorphPhaseOrder: StageMorphPhaseId[] = [
  "nucleus_awake",
  "context_orbit_started",
  "context_collapsed",
  "mode_shifted",
  "sockets_allocated",
  "patch_applied",
  "approval_ritual",
  "workbench_revealed"
];

const stageMorphPhaseLabels: Record<StageMorphPhaseId, string> = {
  nucleus_awake: "Nucleus awake",
  context_orbit_started: "Context orbit",
  context_collapsed: "Context digest",
  mode_shifted: "Mode shift",
  sockets_allocated: "Sockets allocated",
  patch_applied: "Patch growth",
  approval_ritual: "Approval ritual",
  workbench_revealed: "Workbench reveal"
};

const morphRenderableEventTypes: Array<StageEvent["type"]> = [
  "intent.submitted",
  "context.attached",
  "thread.created",
  "thread.status_updated",
  "object.created",
  "object.updated",
  "agent.progress",
  "approval.requested",
  "approval.resolved",
  "artifact.created",
  "artifact.updated",
  "artifact.exported",
  "assistant.speech",
  "user.intervention"
];

const fixtureScenarioById: Record<StageMorphFixtureId, StageShellScenarioId> = {
  planning_task: "plan_seed_round",
  code_task: "build_blackstage",
  approval_artifact_task: "research_synthesis"
};

export function createStageMorphFrame(
  stageEvents: StageEvent[],
  thread: IntentThread
): StageMorphFrame {
  const renderableEvents = stageEvents.filter(isMorphRenderableEvent);
  const latestEvent = renderableEvents.at(-1);
  const mode = resolveMorphMode(thread, latestEvent);
  const activePhaseId = resolveActiveMorphPhaseId(thread, latestEvent, mode);
  const phases = createMorphPhases(thread, renderableEvents, activePhaseId, mode);
  const nucleus = createMorphNucleus(thread, latestEvent, mode, activePhaseId);
  const orbit = createMorphOrbit(thread, activePhaseId);
  const sockets = createMorphSockets(thread, activePhaseId, mode);
  const patches = createMorphPatches(renderableEvents, activePhaseId);
  const approvalRitual = createApprovalRitual(thread);
  const workbench = createMorphWorkbench(thread, activePhaseId, sockets, patches);

  return {
    id: `morph_${thread.id}_${renderableEvents.length}`,
    threadId: thread.id,
    title: thread.title,
    mode,
    activePhaseId,
    phases,
    nucleus,
    orbit,
    sockets,
    patches,
    camera: createMorphCamera(activePhaseId, sockets),
    approvalRitual,
    workbench,
    updatedAt: latestEventUpdatedAt(latestEvent) ?? thread.updatedAt
  };
}

export function eventToStageMorphPhaseId(event: StageEvent): StageMorphPhaseId {
  switch (event.type) {
    case "intent.submitted":
    case "thread.created":
    case "thread.status_updated":
      return "nucleus_awake";
    case "context.attached":
    case "object.created":
    case "object.updated":
      return "context_orbit_started";
    case "agent.progress":
    case "assistant.speech":
    case "user.intervention":
      return "context_collapsed";
    case "approval.requested":
      return "approval_ritual";
    case "approval.resolved":
      return "patch_applied";
    case "artifact.created":
    case "artifact.updated":
    case "artifact.exported":
      return "workbench_revealed";
    case "session.exported":
      return "workbench_revealed";
  }
}

export function createStageMorphFixtureTimeline(
  fixtureId: StageMorphFixtureId
): StageMorphFixtureFrame[] {
  const scenario = getStageShellScenario(fixtureScenarioById[fixtureId]);
  let thread = createScenarioThread(
    scenario,
    scenario.intent,
    "2026-06-01T18:00:00.000Z",
    `session_morph_${fixtureId}`
  );
  const firstRun = createScenarioStageEvents(
    scenario,
    thread,
    thread.createdAt,
    "voice"
  );
  const approvedRun = createApprovedScenarioStageEvents(
    scenario,
    "2026-06-01T18:07:00.000Z"
  ).map((timedEvent) => ({
    ...timedEvent,
    id: `${timedEvent.id}_morph_fixture`,
    delayMs: timedEvent.delayMs + 4_200
  }));
  const events = [...firstRun, ...approvedRun].sort(
    (left, right) => left.delayMs - right.delayMs
  );

  return events.map((timedEvent) => {
    thread = applyStageMorphFixtureEvent(thread, timedEvent.event);

    return {
      id: `morph_fixture_${fixtureId}_${timedEvent.id}`,
      delayMs: timedEvent.delayMs,
      event: timedEvent.event,
      frame: createStageMorphFrame(eventsThroughDelay(events, timedEvent.delayMs), thread)
    };
  });
}

function createMorphPhases(
  thread: IntentThread,
  events: StageEvent[],
  activePhaseId: StageMorphPhaseId,
  mode: StageMorphMode
): StageMorphPhase[] {
  const activeOrder = stageMorphPhaseOrder.indexOf(activePhaseId);

  return stageMorphPhaseOrder.map((phaseId, index) => {
    const eventCount = events.filter(
      (event) => eventToStageMorphPhaseId(event) === phaseId
    ).length;
    const completed = index < activeOrder || phaseCompletionSignal(phaseId, thread, events, mode);
    const active = phaseId === activePhaseId;

    return {
      id: phaseId,
      label: stageMorphPhaseLabels[phaseId],
      order: index + 1,
      completed,
      active,
      intensity: resolvePhaseIntensity(index, activeOrder, completed, active),
      eventCount
    };
  });
}

function phaseCompletionSignal(
  phaseId: StageMorphPhaseId,
  thread: IntentThread,
  events: StageEvent[],
  mode: StageMorphMode
): boolean {
  switch (phaseId) {
    case "nucleus_awake":
      return Boolean(thread.originalIntent || events.length > 0);
    case "context_orbit_started":
      return thread.renderObjects.length > 0 || eventTypesInclude(events, "context.attached");
    case "context_collapsed":
      return thread.agentEvents.length > 0 || thread.approvals.length > 0 || thread.artifacts.length > 0;
    case "mode_shifted":
      return mode !== "idle";
    case "sockets_allocated":
      return thread.renderObjects.length > 0 || thread.approvals.length > 0 || thread.artifacts.length > 0;
    case "patch_applied":
      return events.length > 2;
    case "approval_ritual":
      return thread.approvals.length > 0;
    case "workbench_revealed":
      return thread.artifacts.length > 0;
  }
}

function createMorphNucleus(
  thread: IntentThread,
  latestEvent: StageEvent | undefined,
  mode: StageMorphMode,
  activePhaseId: StageMorphPhaseId
): StageMorphNucleus {
  const voice = resolveVoiceEnvelope(latestEvent, activePhaseId);
  const status = resolveNucleusStatus(thread, activePhaseId);

  return {
    id: `nucleus_${thread.id}`,
    label: thread.originalIntent ? "Intent nucleus" : "Awaiting intent",
    mode,
    status,
    energy: Number(Math.min(1, voice.energy + statusEnergy(status)).toFixed(2)),
    voice
  };
}

function createMorphOrbit(
  thread: IntentThread,
  activePhaseId: StageMorphPhaseId
): StageMorphOrbitObject[] {
  const objects = thread.renderObjects
    .filter((object) => object.type !== "approval_card" && object.type !== "artifact_card")
    .slice(0, 8);
  const count = Math.max(objects.length, 1);

  return objects.map((object, index) => ({
    id: `morph_orbit_${object.id}`,
    sourceObjectId: object.id,
    label: object.title,
    role: resolveOrbitRole(object),
    sourceType: object.type,
    angle: Number((-140 + (280 / count) * index).toFixed(2)),
    distance: Number((0.36 + (index % 3) * 0.08).toFixed(2)),
    weight: resolveOrbitWeight(object, index),
    status: resolveOrbitStatus(activePhaseId)
  }));
}

function createMorphSockets(
  thread: IntentThread,
  activePhaseId: StageMorphPhaseId,
  mode: StageMorphMode
): StageMorphSocket[] {
  const phaseOrder = stageMorphPhaseOrder.indexOf(activePhaseId);
  const sockets: StageMorphSocket[] = [
    createSocket("nucleus", "Nucleus", 50, 43, 14, 14, "resolved", "/nucleus")
  ];

  if (thread.renderObjects.length > 0 || phaseOrder >= stageMorphPhaseOrder.indexOf("context_orbit_started")) {
    sockets.push(createSocket("context", "Context orbit", 22, 38, 28, 28, "filling", "/orbit"));
  }

  if (thread.renderObjects.length > 0 || phaseOrder >= stageMorphPhaseOrder.indexOf("sockets_allocated")) {
    sockets.push(
      createSocket(
        "workspace",
        `${formatModeLabel(mode)} workspace`,
        52,
        38,
        38,
        30,
        phaseOrder >= stageMorphPhaseOrder.indexOf("patch_applied") ? "filling" : "empty",
        "/workbench"
      )
    );
  }

  if (thread.approvals.length > 0) {
    sockets.push(
      createSocket(
        "approval",
        "Approval threshold",
        76,
        52,
        22,
        24,
        thread.approvals.some((approval) => approval.status === "pending") ? "blocked" : "resolved",
        "/approvalRitual"
      )
    );
  }

  if (thread.artifacts.length > 0) {
    sockets.push(
      createSocket("artifact", "Artifact output", 62, 72, 34, 22, "resolved", "/artifacts")
    );
  }

  if (thread.agentEvents.length > 0) {
    sockets.push(
      createSocket("telemetry", "Labor telemetry", 25, 75, 30, 14, "filling", "/telemetry")
    );
  }

  return sockets;
}

function createMorphPatches(
  events: StageEvent[],
  activePhaseId: StageMorphPhaseId
): StageMorphPatch[] {
  return events.map((event, index) => {
    const phaseId = eventToStageMorphPhaseId(event);

    return {
      id: `morph_patch_${index + 1}_${event.type.replace(/\W/g, "_")}`,
      op: resolvePatchOp(event),
      path: resolvePatchPath(event, phaseId),
      label: formatEventLabel(event),
      phaseId,
      source: event.type,
      order: index + 1,
      status: resolvePatchStatus(phaseId, activePhaseId)
    };
  });
}

function createMorphCamera(
  activePhaseId: StageMorphPhaseId,
  sockets: StageMorphSocket[]
): StageMorphCamera {
  const workbenchSocket = sockets.find((socket) => socket.role === "workspace");

  switch (activePhaseId) {
    case "nucleus_awake":
      return { mode: "void_center", tilt: 0, depth: 0.2, focusX: 50, focusY: 44 };
    case "context_orbit_started":
      return { mode: "orbit_field", tilt: 0, depth: 0.36, focusX: 50, focusY: 43 };
    case "context_collapsed":
      return { mode: "digest_focus", tilt: 2, depth: 0.48, focusX: 50, focusY: 43 };
    case "mode_shifted":
    case "sockets_allocated":
    case "patch_applied":
    case "approval_ritual":
      return {
        mode: "socket_table",
        tilt: 4,
        depth: 0.62,
        focusX: workbenchSocket?.x ?? 52,
        focusY: workbenchSocket?.y ?? 42
      };
    case "workbench_revealed":
      return {
        mode: "workbench_tilt",
        tilt: 9,
        depth: 0.78,
        focusX: workbenchSocket?.x ?? 54,
        focusY: workbenchSocket?.y ?? 44
      };
  }
}

function createApprovalRitual(thread: IntentThread): StageMorphApprovalRitual | undefined {
  const approval = thread.approvals.at(-1);

  if (!approval) {
    return undefined;
  }

  return {
    approvalId: approval.id,
    title: approval.title,
    riskLevel: approval.riskLevel,
    actionType: approval.actionType,
    consequence: approval.consequence,
    status: approval.status
  };
}

function createMorphWorkbench(
  thread: IntentThread,
  activePhaseId: StageMorphPhaseId,
  sockets: StageMorphSocket[],
  patches: StageMorphPatch[]
): StageMorphWorkbench {
  const phaseOrder = stageMorphPhaseOrder.indexOf(activePhaseId);
  const patchPhaseOrder = stageMorphPhaseOrder.indexOf("patch_applied");
  const revealPhaseOrder = stageMorphPhaseOrder.indexOf("workbench_revealed");
  const state =
    phaseOrder >= revealPhaseOrder || thread.artifacts.length > 0
      ? "revealed"
      : phaseOrder >= patchPhaseOrder
        ? "patching"
        : phaseOrder >= stageMorphPhaseOrder.indexOf("sockets_allocated")
          ? "allocating"
          : "hidden";

  return {
    state,
    density: Number(
      Math.min(1, (thread.renderObjects.length + thread.artifacts.length + patches.length) / 16).toFixed(2)
    ),
    primarySocketId: sockets.find((socket) => socket.role === "workspace")?.id
  };
}

function resolveActiveMorphPhaseId(
  thread: IntentThread,
  latestEvent: StageEvent | undefined,
  mode: StageMorphMode
): StageMorphPhaseId {
  if (!thread.originalIntent && !latestEvent) {
    return "nucleus_awake";
  }

  if (latestEvent) {
    const eventPhase = eventToStageMorphPhaseId(latestEvent);

    if (thread.artifacts.length > 0 && eventPhase === "context_orbit_started") {
      return "workbench_revealed";
    }

    if (eventPhase === "context_orbit_started" && mode !== "idle" && thread.renderObjects.length > 1) {
      return "sockets_allocated";
    }

    return eventPhase;
  }

  if (thread.artifacts.length > 0) {
    return "workbench_revealed";
  }

  if (thread.approvals.some((approval) => approval.status === "pending")) {
    return "approval_ritual";
  }

  if (thread.renderObjects.length > 0) {
    return "sockets_allocated";
  }

  return mode === "idle" ? "nucleus_awake" : "mode_shifted";
}

function resolveMorphMode(
  thread: IntentThread,
  latestEvent: StageEvent | undefined
): StageMorphMode {
  if (!thread.originalIntent) {
    return "idle";
  }

  if (thread.approvals.some((approval) => approval.status === "pending")) {
    return "approval";
  }

  if (thread.artifacts.length > 0) {
    return "artifact";
  }

  const modeText = [
    thread.title,
    thread.originalIntent,
    thread.currentObjective,
    thread.renderObjects.map((object) => `${object.type} ${object.title}`).join(" "),
    latestEvent ? formatEventLabel(latestEvent) : ""
  ]
    .join(" ")
    .toLowerCase();

  if (modeText.includes("code") || modeText.includes("codex") || modeText.includes("build")) {
    return "coding";
  }

  if (modeText.includes("research") || modeText.includes("synthesis") || modeText.includes("evidence")) {
    return "research";
  }

  if (modeText.includes("memory")) {
    return "memory";
  }

  return "planning";
}

function resolveVoiceEnvelope(
  latestEvent: StageEvent | undefined,
  activePhaseId: StageMorphPhaseId
): StageMorphVoiceEnvelope {
  const source = latestEvent?.type === "intent.submitted" && latestEvent.payload.inputMode === "voice"
    ? "live"
    : latestEvent
      ? "simulated"
      : "none";

  switch (activePhaseId) {
    case "nucleus_awake":
      return { source, energy: source === "none" ? 0.12 : 0.28, cadence: source === "none" ? "silent" : "wake" };
    case "context_orbit_started":
      return { source, energy: 0.48, cadence: "context" };
    case "context_collapsed":
    case "mode_shifted":
      return { source, energy: 0.6, cadence: "synthesis" };
    case "sockets_allocated":
    case "patch_applied":
    case "approval_ritual":
      return { source, energy: 0.68, cadence: "synthesis" };
    case "workbench_revealed":
      return { source, energy: 0.78, cadence: "reveal" };
  }
}

function resolveNucleusStatus(
  thread: IntentThread,
  activePhaseId: StageMorphPhaseId
): StageMorphNucleus["status"] {
  if (!thread.originalIntent) {
    return "idle";
  }

  if (thread.approvals.some((approval) => approval.status === "pending")) {
    return "awaiting_approval";
  }

  switch (activePhaseId) {
    case "nucleus_awake":
    case "context_orbit_started":
      return "listening";
    case "context_collapsed":
    case "mode_shifted":
      return "digesting";
    case "sockets_allocated":
    case "patch_applied":
    case "approval_ritual":
      return "generating";
    case "workbench_revealed":
      return "revealed";
  }
}

function statusEnergy(status: StageMorphNucleus["status"]): number {
  switch (status) {
    case "idle":
      return 0.04;
    case "listening":
      return 0.1;
    case "digesting":
      return 0.16;
    case "generating":
      return 0.2;
    case "awaiting_approval":
      return 0.22;
    case "revealed":
      return 0.12;
  }
}

function resolveOrbitRole(object: StageObject): StageMorphOrbitObject["role"] {
  switch (object.type) {
    case "intent_card":
      return "intent";
    case "plan_card":
    case "model_card":
    case "simulation_card":
    case "codex_task_card":
    case "code_diff":
      return "tool";
    case "artifact_card":
      return "artifact";
    default:
      return "context";
  }
}

function resolveOrbitStatus(
  activePhaseId: StageMorphPhaseId
): StageMorphOrbitObject["status"] {
  switch (activePhaseId) {
    case "context_collapsed":
    case "mode_shifted":
      return "digesting";
    case "sockets_allocated":
    case "patch_applied":
    case "approval_ritual":
    case "workbench_revealed":
      return "resolved";
    case "nucleus_awake":
    case "context_orbit_started":
      return "orbiting";
  }
}

function resolveOrbitWeight(object: StageObject, index: number): number {
  const base = object.state === "focused" ? 1 : 0.62;

  return Number(Math.max(0.3, base - index * 0.04).toFixed(2));
}

function createSocket(
  role: StageMorphSocketRole,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  state: StageMorphSocket["state"],
  patchPath: string
): StageMorphSocket {
  return {
    id: `morph_socket_${role}`,
    role,
    label,
    x,
    y,
    width,
    height,
    state,
    patchPath
  };
}

function resolvePatchOp(event: StageEvent): StageMorphPatchOp {
  switch (event.type) {
    case "approval.requested":
    case "approval.resolved":
    case "user.intervention":
      return "action";
    case "thread.status_updated":
    case "object.updated":
    case "artifact.updated":
      return "replace";
    case "assistant.speech":
      return "bind";
    case "intent.submitted":
    case "context.attached":
    case "thread.created":
    case "object.created":
    case "agent.progress":
    case "artifact.created":
    case "artifact.exported":
    case "session.exported":
      return "add";
  }
}

function resolvePatchPath(
  event: StageEvent,
  phaseId: StageMorphPhaseId
): string {
  switch (event.type) {
    case "intent.submitted":
    case "thread.created":
      return "/nucleus";
    case "context.attached":
    case "object.created":
    case "object.updated":
      return "/orbit";
    case "agent.progress":
    case "assistant.speech":
    case "thread.status_updated":
    case "user.intervention":
      return `/phases/${phaseId}`;
    case "approval.requested":
    case "approval.resolved":
      return "/approvalRitual";
    case "artifact.created":
    case "artifact.updated":
    case "artifact.exported":
    case "session.exported":
      return "/workbench";
  }
}

function resolvePatchStatus(
  phaseId: StageMorphPhaseId,
  activePhaseId: StageMorphPhaseId
): StageMorphPatchStatus {
  const phaseOrder = stageMorphPhaseOrder.indexOf(phaseId);
  const activeOrder = stageMorphPhaseOrder.indexOf(activePhaseId);

  if (phaseId === "approval_ritual") {
    return activePhaseId === "approval_ritual" ? "blocked" : "applied";
  }

  if (phaseOrder < activeOrder) {
    return "applied";
  }

  if (phaseOrder === activeOrder) {
    return "streaming";
  }

  return "queued";
}

function resolvePhaseIntensity(
  index: number,
  activeOrder: number,
  completed: boolean,
  active: boolean
): number {
  if (active) {
    return 1;
  }

  if (completed) {
    return 0.72;
  }

  return Number(Math.max(0.16, 0.34 - Math.max(0, index - activeOrder) * 0.04).toFixed(2));
}

function formatModeLabel(mode: StageMorphMode): string {
  return mode === "idle" ? "Idle" : `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}

function formatEventLabel(event: StageEvent): string {
  switch (event.type) {
    case "intent.submitted":
      return event.payload.rawText;
    case "thread.created":
      return event.payload.title;
    case "context.attached":
      return event.payload.fileName;
    case "thread.status_updated":
      return event.payload.status;
    case "object.created":
    case "object.updated":
      return event.payload.title;
    case "agent.progress":
      return event.payload.summary;
    case "approval.requested":
      return event.payload.title;
    case "approval.resolved":
      return event.payload.status;
    case "artifact.created":
    case "artifact.updated":
      return event.payload.title;
    case "artifact.exported":
      return event.payload.title;
    case "assistant.speech":
      return event.payload.text;
    case "user.intervention":
      return event.payload.commandText ?? event.payload.interventionType;
    case "session.exported":
      return event.payload.sessionId;
  }
}

function latestEventUpdatedAt(event: StageEvent | undefined): string | undefined {
  if (!event) {
    return undefined;
  }

  switch (event.type) {
    case "intent.submitted":
      return event.payload.submittedAt;
    case "context.attached":
      return event.payload.attachedAt;
    case "thread.created":
      return event.payload.updatedAt;
    case "thread.status_updated":
      return event.payload.updatedAt;
    case "object.created":
    case "object.updated":
      return event.payload.updatedAt;
    case "agent.progress":
      return event.payload.timestamp;
    case "approval.requested":
      return event.payload.createdAt;
    case "approval.resolved":
      return event.payload.resolvedAt;
    case "artifact.created":
    case "artifact.updated":
      return event.payload.updatedAt;
    case "artifact.exported":
      return event.payload.exportedAt;
    case "assistant.speech":
      return event.payload.spokenAt;
    case "user.intervention":
      return event.payload.timestamp;
    case "session.exported":
      return event.payload.exportedAt;
  }
}

function isMorphRenderableEvent(event: StageEvent): boolean {
  return morphRenderableEventTypes.includes(event.type);
}

function eventTypesInclude(
  events: StageEvent[],
  eventType: StageEvent["type"]
): boolean {
  return events.some((event) => event.type === eventType);
}

function eventsThroughDelay(
  events: TimedStageEvent[],
  delayMs: number
): StageEvent[] {
  return events
    .filter((candidate) => candidate.delayMs <= delayMs)
    .map((candidate) => candidate.event);
}

function applyStageMorphFixtureEvent(
  thread: IntentThread,
  event: StageEvent
): IntentThread {
  switch (event.type) {
    case "thread.created":
      return event.payload;
    case "object.created":
    case "object.updated":
      return {
        ...thread,
        renderObjects: upsertById(thread.renderObjects, event.payload),
        updatedAt: event.payload.updatedAt
      };
    case "agent.progress":
      return {
        ...thread,
        agentEvents: upsertById(thread.agentEvents, event.payload),
        updatedAt: event.payload.timestamp
      };
    case "approval.requested":
      return {
        ...thread,
        approvals: upsertById(thread.approvals, event.payload),
        updatedAt: event.payload.createdAt
      };
    case "approval.resolved":
      return {
        ...thread,
        approvals: thread.approvals.map((approval) =>
          approval.id === event.payload.approvalId
            ? {
                ...approval,
                status: event.payload.status,
                resolvedAt: event.payload.resolvedAt
              }
            : approval
        ),
        updatedAt: event.payload.resolvedAt
      };
    case "artifact.created":
    case "artifact.updated":
      return {
        ...thread,
        artifacts: upsertById(thread.artifacts, event.payload),
        updatedAt: event.payload.updatedAt
      };
    case "thread.status_updated":
      return {
        ...thread,
        status: event.payload.status,
        updatedAt: event.payload.updatedAt
      };
    case "intent.submitted":
    case "context.attached":
    case "artifact.exported":
    case "assistant.speech":
    case "user.intervention":
    case "session.exported":
      return thread;
  }
}

function upsertById<Item extends { id: string }>(items: Item[], nextItem: Item): Item[] {
  const index = items.findIndex((item) => item.id === nextItem.id);

  if (index === -1) {
    return [...items, nextItem];
  }

  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}
