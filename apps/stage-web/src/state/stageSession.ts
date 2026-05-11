import type {
  AgentEvent,
  ApprovalRequest,
  Artifact,
  IntentThread,
  ResearchEvent,
  StageEvent,
  StageObject,
  StageShellScenarioId
} from "@blackstage/stage-core";
import type { MemoryVaultRecord } from "@blackstage/memory-core";

export const STAGE_SESSION_STORAGE_KEY = "blackstage.stageShell.v0.1";

const LEGACY_STORAGE_KEYS = ["blackstage.stageShell.v0"];

export type StageSessionSnapshot = {
  sessionId: string;
  activeScenarioId?: StageShellScenarioId;
  currentThread?: IntentThread;
  stageEvents: StageEvent[];
  researchEvents: ResearchEvent[];
  memoryRecords: MemoryVaultRecord[];
  savedAt: string;
};

export function createStageSession(
  sessionId = createSessionId()
): StageSessionSnapshot {
  return {
    sessionId,
    stageEvents: [],
    researchEvents: [],
    memoryRecords: [],
    savedAt: new Date().toISOString()
  };
}

export function loadStageSession(): StageSessionSnapshot | undefined {
  try {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(legacyKey);
    }

    const rawSnapshot = localStorage.getItem(STAGE_SESSION_STORAGE_KEY);

    if (!rawSnapshot) {
      return undefined;
    }

    return JSON.parse(rawSnapshot) as StageSessionSnapshot;
  } catch {
    return undefined;
  }
}

export function saveStageSession(snapshot: StageSessionSnapshot): void {
  localStorage.setItem(
    STAGE_SESSION_STORAGE_KEY,
    JSON.stringify({
      ...snapshot,
      savedAt: new Date().toISOString()
    })
  );
}

export function clearStageSession(): void {
  localStorage.removeItem(STAGE_SESSION_STORAGE_KEY);

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(legacyKey);
  }
}

export function applyStageEventToThread(
  currentThread: IntentThread,
  stageEvent: StageEvent
): IntentThread {
  switch (stageEvent.type) {
    case "thread.created":
      return stageEvent.payload;
    case "thread.status_updated":
      return {
        ...currentThread,
        status: stageEvent.payload.status,
        updatedAt: stageEvent.payload.updatedAt
      };
    case "object.created":
    case "object.updated":
      return {
        ...currentThread,
        status: "active",
        updatedAt: stageEvent.payload.updatedAt,
        renderObjects: upsertById(currentThread.renderObjects, stageEvent.payload)
      };
    case "agent.progress":
      return {
        ...currentThread,
        status: "active",
        updatedAt: stageEvent.payload.timestamp,
        agentEvents: upsertById(currentThread.agentEvents, stageEvent.payload)
      };
    case "approval.requested":
      return {
        ...currentThread,
        status: "active",
        updatedAt: stageEvent.payload.createdAt,
        approvals: upsertById(currentThread.approvals, stageEvent.payload)
      };
    case "approval.resolved":
      return {
        ...currentThread,
        status: stageEvent.payload.status === "approved" ? "completed" : "paused",
        updatedAt: stageEvent.payload.resolvedAt,
        approvals: currentThread.approvals.map((approval) =>
          approval.id === stageEvent.payload.approvalId
            ? {
                ...approval,
                status: stageEvent.payload.status,
                resolvedAt: stageEvent.payload.resolvedAt
              }
            : approval
        )
      };
    case "artifact.created":
    case "artifact.updated":
      return {
        ...currentThread,
        status: stageEvent.payload.status === "approved" ? "completed" : "active",
        updatedAt: stageEvent.payload.updatedAt,
        artifacts: upsertById(currentThread.artifacts, stageEvent.payload)
      };
    case "artifact.exported":
      return {
        ...currentThread,
        updatedAt: stageEvent.payload.exportedAt,
        artifacts: currentThread.artifacts.map((artifact) =>
          artifact.id === stageEvent.payload.artifactId
            ? {
                ...artifact,
                status: "exported",
                updatedAt: stageEvent.payload.exportedAt
              }
            : artifact
        )
      };
    default:
      return currentThread;
  }
}

function createSessionId(): string {
  return `stage_session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function upsertById<Item extends StageObject | Artifact | ApprovalRequest | AgentEvent>(
  items: Item[],
  nextItem: Item
): Item[] {
  const exists = items.some((item) => item.id === nextItem.id);

  if (!exists) {
    return [...items, nextItem];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}
