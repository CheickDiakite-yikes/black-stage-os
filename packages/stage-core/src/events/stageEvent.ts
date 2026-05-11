import type { AgentEvent } from "../domain/AgentEvent";
import type { ApprovalRequest } from "../domain/ApprovalRequest";
import type { ApprovalStatus } from "../domain/ApprovalRequest";
import type { Artifact } from "../domain/Artifact";
import type { IntentThread } from "../domain/IntentThread";
import type { IntentThreadStatus } from "../domain/IntentThread";
import type { StageObject } from "../domain/StageObject";

export type IntentPayload = {
  rawText: string;
  submittedAt: string;
  inputMode: "voice" | "text";
};

export type ContextAttachmentPayload = {
  attachmentId: string;
  threadId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  modality: "text" | "image" | "file";
  previewAvailable?: boolean;
  previewKind?: "session_object_url";
  imageDimensions?: {
    width: number;
    height: number;
  };
  structuredKind?: "csv" | "json";
  structuredItemCount?: number;
  attachedAt: string;
  localOnly: true;
};

export type ThreadStatusPayload = {
  threadId: string;
  status: IntentThreadStatus;
  updatedAt: string;
  reason: "user_stop" | "user_resume" | "runtime_completed" | "runtime_paused";
};

export type ApprovalResolutionPayload = {
  approvalId: string;
  threadId: string;
  status: Exclude<ApprovalStatus, "pending">;
  resolvedAt: string;
  userRequestedExplanation: boolean;
};

export type UserInterventionPayload = {
  interventionId: string;
  threadId: string;
  interventionType:
    | "stop"
    | "resume"
    | "redirect"
    | "edit"
    | "ask_why"
    | "undo"
    | "retry";
  commandAction?:
    | "focus"
    | "pin"
    | "unpin"
    | "collapse"
    | "expand"
    | "rename"
    | "set_url"
    | "set_map"
    | "set_model";
  commandValue?: string;
  commandText?: string;
  commandInputMode?: "voice" | "text";
  targetObjectId?: string;
  timestamp: string;
};

export type SessionExportedPayload = {
  sessionId: string;
  threadId: string;
  exportedAt: string;
  eventCount: number;
};

export type ArtifactExportedPayload = {
  artifactId: string;
  threadId: string;
  exportedAt: string;
  format: "markdown" | "json";
  title: string;
};

export type AssistantSpeechPayload = {
  speechId: string;
  threadId: string;
  text: string;
  spokenAt: string;
  source: "stage_status";
};

export type StageEvent =
  | { type: "intent.submitted"; payload: IntentPayload }
  | { type: "context.attached"; payload: ContextAttachmentPayload }
  | { type: "thread.created"; payload: IntentThread }
  | { type: "thread.status_updated"; payload: ThreadStatusPayload }
  | { type: "object.created"; payload: StageObject }
  | { type: "object.updated"; payload: StageObject }
  | { type: "agent.progress"; payload: AgentEvent }
  | { type: "approval.requested"; payload: ApprovalRequest }
  | { type: "approval.resolved"; payload: ApprovalResolutionPayload }
  | { type: "artifact.created"; payload: Artifact }
  | { type: "artifact.updated"; payload: Artifact }
  | { type: "artifact.exported"; payload: ArtifactExportedPayload }
  | { type: "assistant.speech"; payload: AssistantSpeechPayload }
  | { type: "user.intervention"; payload: UserInterventionPayload }
  | { type: "session.exported"; payload: SessionExportedPayload };
