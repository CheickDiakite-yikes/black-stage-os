import type { EvidenceRef, IsoTimestamp } from "./shared";

export type AgentEventType =
  | "planned"
  | "started"
  | "progress"
  | "completed"
  | "failed"
  | "blocked"
  | "approval_requested"
  | "cancelled";

export type AgentEvent = {
  id: string;
  threadId: string;
  taskId?: string;
  agentName: string;
  type: AgentEventType;
  summary: string;
  details?: string;
  evidence?: EvidenceRef[];
  timestamp: IsoTimestamp;
};
