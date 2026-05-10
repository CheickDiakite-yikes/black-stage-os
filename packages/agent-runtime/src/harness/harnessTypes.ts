export type HarnessTaskKind = "codex" | "agent" | "voice" | "research" | "artifact";

export type HarnessTaskStatus =
  | "queued"
  | "running"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type HarnessRunStatus = "running" | "blocked" | "completed" | "failed" | "cancelled";

export type HarnessAdapterMode = "simulated" | "codex" | "agents_sdk" | "realtime";

export type HarnessWorkspace = {
  kind: "local";
  path: string;
};

export type HarnessTask = {
  id: string;
  threadId: string;
  title: string;
  objective: string;
  kind: HarnessTaskKind;
  status: HarnessTaskStatus;
  priority: number;
  approvalRequired: boolean;
  blockedBy: string[];
  workspace?: HarnessWorkspace;
  createdAt: string;
  updatedAt: string;
};

export type HarnessRun = {
  id: string;
  taskId: string;
  adapterId: string;
  status: HarnessRunStatus;
  startedAt: string;
  completedAt?: string;
  summary?: string;
};

export type HarnessEventType =
  | "task.queued"
  | "task.blocked"
  | "task.started"
  | "task.progress"
  | "task.completed"
  | "task.failed"
  | "task.cancelled"
  | "approval.required";

export type HarnessEvent = {
  id: string;
  taskId: string;
  runId?: string;
  type: HarnessEventType;
  summary: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type HarnessTaskInput = {
  id?: string;
  threadId: string;
  title: string;
  objective: string;
  kind: HarnessTaskKind;
  priority?: number;
  approvalRequired?: boolean;
  blockedBy?: string[];
  workspace?: HarnessWorkspace;
};

export type HarnessRunResult = {
  status: Exclude<HarnessRunStatus, "running">;
  summary: string;
  events?: Array<Omit<HarnessEvent, "id" | "taskId" | "runId" | "timestamp">>;
};

export type HarnessAdapter = {
  id: string;
  label: string;
  mode: HarnessAdapterMode;
  accepts: HarnessTaskKind[];
  canRun: (task: HarnessTask) => boolean;
  run: (task: HarnessTask) => HarnessRunResult | Promise<HarnessRunResult>;
};

export type HarnessSchedulerSnapshot = {
  tasks: HarnessTask[];
  runs: HarnessRun[];
  events: HarnessEvent[];
};
