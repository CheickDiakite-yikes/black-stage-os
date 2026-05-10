import type {
  AgentEvent,
  StageObject,
  TimedStageEvent
} from "@blackstage/stage-core";
import type {
  HarnessEvent,
  HarnessRun,
  HarnessSchedulerSnapshot,
  HarnessTask
} from "./harnessTypes";

export function createBuildBlackstageHarnessStageEvents(
  threadId: string,
  emittedAt = new Date().toISOString(),
  delayOffsetMs = 1_240,
  idPrefix = "build_blackstage_harness",
  recorderTitle = "Background harness recorder"
): TimedStageEvent[] {
  return projectHarnessSnapshotToStageEvents(
    createBuildBlackstageHarnessSnapshot(threadId, emittedAt, idPrefix),
    threadId,
    emittedAt,
    delayOffsetMs,
    idPrefix,
    recorderTitle
  );
}

export function createBuildBlackstageHarnessSnapshot(
  threadId: string,
  timestamp = new Date().toISOString(),
  idPrefix = "build_blackstage_harness"
): HarnessSchedulerSnapshot {
  const tasks: HarnessTask[] = [
    createHarnessTask(`${idPrefix}_codex_run`, threadId, "Background Codex run", "codex", "completed", timestamp),
    createHarnessTask(
      `${idPrefix}_approval_gate`,
      threadId,
      "Approval-gated workspace write",
      "codex",
      "blocked",
      timestamp,
      true
    ),
    createHarnessTask(
      `${idPrefix}_artifact_packet`,
      threadId,
      "Completed harness artifact",
      "artifact",
      "completed",
      timestamp
    ),
    createHarnessTask(
      `${idPrefix}_replay_failure`,
      threadId,
      "Replayable failure packet",
      "research",
      "failed",
      timestamp
    )
  ];
  const runs: HarnessRun[] = [
    {
      id: `${idPrefix}_run_codex`,
      taskId: `${idPrefix}_codex_run`,
      adapterId: "codex_adapter_simulated",
      status: "completed",
      startedAt: timestamp,
      completedAt: timestamp,
      summary: "Simulated Codex worker produced a validation-ready patch packet."
    },
    {
      id: `${idPrefix}_run_artifact`,
      taskId: `${idPrefix}_artifact_packet`,
      adapterId: "artifact_adapter_simulated",
      status: "completed",
      startedAt: timestamp,
      completedAt: timestamp,
      summary: "Harness artifact packet completed locally."
    },
    {
      id: `${idPrefix}_run_failure`,
      taskId: `${idPrefix}_replay_failure`,
      adapterId: "research_adapter_simulated",
      status: "failed",
      startedAt: timestamp,
      completedAt: timestamp,
      summary: "Failure preserved with enough context for replay."
    }
  ];
  const events: HarnessEvent[] = [
    createHarnessEvent(`${idPrefix}_event_codex_started`, `${idPrefix}_codex_run`, `${idPrefix}_run_codex`, "task.started", "Background Codex run started.", timestamp),
    createHarnessEvent(`${idPrefix}_event_codex_completed`, `${idPrefix}_codex_run`, `${idPrefix}_run_codex`, "task.completed", "Background Codex run completed.", timestamp),
    createHarnessEvent(`${idPrefix}_event_approval_blocked`, `${idPrefix}_approval_gate`, undefined, "approval.required", "Approval gate blocked workspace write.", timestamp),
    createHarnessEvent(`${idPrefix}_event_artifact_completed`, `${idPrefix}_artifact_packet`, `${idPrefix}_run_artifact`, "task.completed", "Completed artifact packet ready.", timestamp),
    createHarnessEvent(`${idPrefix}_event_failure`, `${idPrefix}_replay_failure`, `${idPrefix}_run_failure`, "task.failed", "Replayable failure captured.", timestamp)
  ];

  return {
    tasks,
    runs,
    events
  };
}

export function projectHarnessSnapshotToStageEvents(
  snapshot: HarnessSchedulerSnapshot,
  threadId: string,
  emittedAt = new Date().toISOString(),
  delayOffsetMs = 0,
  idPrefix = "build_blackstage_harness",
  recorderTitle = "Background harness recorder"
): TimedStageEvent[] {
  const timelineObject = createHarnessTimelineObject(snapshot, threadId, emittedAt, idPrefix, recorderTitle);
  const proofObject = createHarnessProofObject(snapshot, threadId, emittedAt, idPrefix);
  const agentEvents = snapshot.events.map((event, index) =>
    createAgentEventFromHarnessEvent(event, threadId, emittedAt, index)
  );
  const stageEvents: TimedStageEvent[] = [
    {
      id: `${timelineObject.id}_created`,
      delayMs: delayOffsetMs,
      event: {
        type: "object.created",
        payload: timelineObject
      }
    },
    {
      id: `${proofObject.id}_created`,
      delayMs: delayOffsetMs + 180,
      event: {
        type: "object.created",
        payload: proofObject
      }
    },
    ...agentEvents.map((agentEvent, index) => ({
      id: `${agentEvent.id}_emitted`,
      delayMs: delayOffsetMs + 260 + index * 180,
      event: {
        type: "agent.progress" as const,
        payload: agentEvent
      }
    }))
  ];

  return stageEvents;
}

function createHarnessTimelineObject(
  snapshot: HarnessSchedulerSnapshot,
  threadId: string,
  timestamp: string,
  idPrefix: string,
  title: string
): StageObject {
  return {
    id: `${idPrefix}_timeline`,
    threadId,
    type: "timeline",
    title,
    summary: "A local scheduler trace shows background Codex work, approval blocking, artifact completion, and replayable failure.",
    payload: {
      steps: [
        "Background Codex run completed",
        "Approval gate blocked workspace write",
        "Completed artifact packet ready",
        "Replayable failure captured"
      ],
      taskCount: snapshot.tasks.length,
      runCount: snapshot.runs.length,
      eventCount: snapshot.events.length
    },
    position: {
      x: 28,
      y: 84,
      z: 20
    },
    state: "expanded",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createHarnessProofObject(
  snapshot: HarnessSchedulerSnapshot,
  threadId: string,
  timestamp: string,
  idPrefix: string
): StageObject {
  return {
    id: `${idPrefix}_proof`,
    threadId,
    type: "research_note",
    title: "Harness proof packet",
    summary: "The background harness remains local-only and emits stage-visible proof instead of hiding behind a spinner.",
    payload: {
      notes: snapshot.tasks.map((task) => `${task.title}: ${task.status}`),
      policy: "No live API call, no Codex subprocess, no external tracker.",
      replay: "Harness events are projected into the same stage event log as simulated UI events."
    },
    position: {
      x: 62,
      y: 84,
      z: 21
    },
    state: "expanded",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createAgentEventFromHarnessEvent(
  event: HarnessEvent,
  threadId: string,
  timestamp: string,
  index: number
): AgentEvent {
  return {
    id: `agent_harness_${index}_${event.id}`,
    threadId,
    taskId: event.taskId,
    agentName: "Blackstage local harness",
    type: agentTypeFromHarnessEvent(event.type),
    summary: event.summary,
    details: `Harness event ${event.type} was projected from the local scheduler snapshot.`,
    evidence: [
      {
        id: `evidence_${event.id}`,
        label: "Local harness event",
        sourceType: "agent_log",
        excerpt: event.summary
      }
    ],
    timestamp
  };
}

function agentTypeFromHarnessEvent(type: HarnessEvent["type"]): AgentEvent["type"] {
  switch (type) {
    case "task.started":
      return "started";
    case "task.completed":
      return "completed";
    case "task.failed":
      return "failed";
    case "approval.required":
      return "blocked";
    case "task.cancelled":
      return "cancelled";
    case "task.progress":
      return "progress";
    case "task.queued":
      return "planned";
    case "task.blocked":
      return "blocked";
    default:
      return "progress";
  }
}

function createHarnessTask(
  id: string,
  threadId: string,
  title: string,
  kind: HarnessTask["kind"],
  status: HarnessTask["status"],
  timestamp: string,
  approvalRequired = false
): HarnessTask {
  return {
    id,
    threadId,
    title,
    objective: title,
    kind,
    status,
    priority: 0,
    approvalRequired,
    blockedBy: [],
    workspace: {
      kind: "local",
      path: `.blackstage/workspaces/${id}`
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createHarnessEvent(
  id: string,
  taskId: string,
  runId: string | undefined,
  type: HarnessEvent["type"],
  summary: string,
  timestamp: string
): HarnessEvent {
  return {
    id,
    taskId,
    runId,
    type,
    summary,
    timestamp
  };
}
