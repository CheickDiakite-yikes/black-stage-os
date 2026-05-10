import type { AgentEvent } from "./AgentEvent";
import type { ApprovalRequest } from "./ApprovalRequest";
import type { Artifact } from "./Artifact";
import type { StageObject } from "./StageObject";
import type { DecisionRecord, IsoTimestamp, MemoryNote } from "./shared";

export type IntentThreadStatus = "active" | "paused" | "completed" | "archived";

export type IntentThread = {
  id: string;
  title: string;
  originalIntent: string;
  currentObjective: string;
  status: IntentThreadStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  contextSummary?: string;
  renderObjects: StageObject[];
  agentEvents: AgentEvent[];
  artifacts: Artifact[];
  approvals: ApprovalRequest[];
  memoryNotes: MemoryNote[];
  decisions: DecisionRecord[];
  researchSessionId?: string;
};
