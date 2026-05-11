import type { IsoTimestamp } from "./shared";

export type ApprovalActionType =
  | "external_message"
  | "file_write"
  | "file_delete"
  | "purchase"
  | "calendar_action"
  | "data_share"
  | "network_access"
  | "code_execution"
  | "credential_use"
  | "memory_write"
  | "memory_delete"
  | "tool_call";

export type ApprovalRiskLevel = "low" | "medium" | "high" | "critical";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "edited" | "expired";

export type ApprovalToolCall = {
  provider: "openai_realtime" | "local_harness";
  callId: string;
  toolName: string;
  argumentsJson?: string;
};

export type ApprovalRequest = {
  id: string;
  threadId: string;
  actionType: ApprovalActionType;
  title: string;
  summary: string;
  riskLevel: ApprovalRiskLevel;
  proposedBy: string;
  scope: string;
  consequence: string;
  undoPath?: string;
  status: ApprovalStatus;
  createdAt: IsoTimestamp;
  resolvedAt?: IsoTimestamp;
  toolCall?: ApprovalToolCall;
};
