import type {
  HarnessSchedulerSnapshot,
  HarnessTask,
  HarnessTaskStatus
} from "./harnessTypes";

export type SymphonyControlPlaneKind = "blackstage_internal_queue";

export type SymphonyLane =
  | "queued"
  | "running"
  | "needs_approval"
  | "human_review"
  | "failed"
  | "cancelled";

export type SymphonyWorkItem = {
  id: string;
  threadId: string;
  title: string;
  lane: SymphonyLane;
  agentKind: HarnessTask["kind"];
  workspacePath?: string;
  approvalRequired: boolean;
  humanReviewRequired: boolean;
  blockedBy: string[];
};

export type SymphonyControlPlaneSnapshot = {
  kind: SymphonyControlPlaneKind;
  workItems: SymphonyWorkItem[];
  openWorkCount: number;
  reviewCount: number;
  blockedCount: number;
};

export function createSymphonyControlPlaneSnapshot(
  snapshot: HarnessSchedulerSnapshot
): SymphonyControlPlaneSnapshot {
  const workItems = snapshot.tasks.map(createSymphonyWorkItem);

  return {
    kind: "blackstage_internal_queue",
    workItems,
    openWorkCount: workItems.filter((item) => item.lane === "queued" || item.lane === "running")
      .length,
    reviewCount: workItems.filter((item) => item.lane === "human_review").length,
    blockedCount: workItems.filter((item) => item.lane === "needs_approval").length
  };
}

export function createSymphonyWorkItem(task: HarnessTask): SymphonyWorkItem {
  return {
    id: task.id,
    threadId: task.threadId,
    title: task.title,
    lane: laneFromTaskStatus(task.status, task.approvalRequired),
    agentKind: task.kind,
    workspacePath: task.workspace?.path,
    approvalRequired: task.approvalRequired,
    humanReviewRequired: task.kind === "codex" || task.kind === "artifact",
    blockedBy: task.blockedBy
  };
}

function laneFromTaskStatus(
  status: HarnessTaskStatus,
  approvalRequired: boolean
): SymphonyLane {
  if (approvalRequired && (status === "queued" || status === "blocked")) {
    return "needs_approval";
  }

  switch (status) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "completed":
      return "human_review";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "blocked":
      return "needs_approval";
  }
}
