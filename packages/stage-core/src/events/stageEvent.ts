import type { AgentEvent } from "../domain/AgentEvent";
import type { ApprovalRequest } from "../domain/ApprovalRequest";
import type { Artifact } from "../domain/Artifact";
import type { IntentThread } from "../domain/IntentThread";
import type { StageObject } from "../domain/StageObject";

export type IntentPayload = {
  rawText: string;
  submittedAt: string;
  inputMode: "voice" | "text";
};

export type StageEvent =
  | { type: "intent.submitted"; payload: IntentPayload }
  | { type: "thread.created"; payload: IntentThread }
  | { type: "object.created"; payload: StageObject }
  | { type: "agent.progress"; payload: AgentEvent }
  | { type: "approval.requested"; payload: ApprovalRequest }
  | { type: "artifact.created"; payload: Artifact };
