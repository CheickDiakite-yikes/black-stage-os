import type { IsoTimestamp } from "./shared";

export type ResearchEventType =
  | "intent_submitted"
  | "context_attached"
  | "thread_created"
  | "render_object_created"
  | "render_object_updated"
  | "agent_event"
  | "approval_requested"
  | "approval_resolved"
  | "artifact_created"
  | "artifact_updated"
  | "artifact_exported"
  | "assistant_speech"
  | "user_intervention"
  | "morphology_frame_captured"
  | "session_exported"
  | "wow_signal"
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
