import type { IsoTimestamp } from "./shared";

export type ResearchEventType =
  | "intent_submitted"
  | "render_object_created"
  | "agent_event"
  | "approval_requested"
  | "approval_resolved"
  | "artifact_created"
  | "user_intervention"
  | "codex_task_started"
  | "codex_task_completed"
  | "research_note_created";

export type ResearchEvent = {
  id: string;
  sessionId: string;
  threadId?: string;
  eventType: ResearchEventType;
  payload: unknown;
  timestamp: IsoTimestamp;
};
