import type { ResearchEvent, ResearchEventType, StageEvent } from "@blackstage/stage-core";
import { redactIntentText } from "./redaction";

export function createResearchEvent(
  sessionId: string,
  eventType: ResearchEventType,
  payload: unknown,
  threadId?: string,
  timestamp = new Date().toISOString()
): ResearchEvent {
  return {
    id: `${eventType}_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId,
    threadId,
    eventType,
    payload,
    timestamp
  };
}

export function researchEventFromStageEvent(
  sessionId: string,
  stageEvent: StageEvent
): ResearchEvent | undefined {
  switch (stageEvent.type) {
    case "intent.submitted":
      return createResearchEvent(sessionId, "intent_submitted", {
        input_mode: stageEvent.payload.inputMode,
        intent_text_redacted: redactIntentText(stageEvent.payload.rawText),
        intent_length: stageEvent.payload.rawText.length
      });
    case "context.attached":
      return createResearchEvent(
        sessionId,
        "context_attached",
        {
          attachment_id: stageEvent.payload.attachmentId,
          file_extension: readExtension(stageEvent.payload.fileName),
          mime_type: stageEvent.payload.mimeType,
          file_size: stageEvent.payload.fileSize,
          modality: stageEvent.payload.modality,
          local_only: stageEvent.payload.localOnly
        },
        stageEvent.payload.threadId
      );
    case "thread.created":
      return createResearchEvent(
        sessionId,
        "thread_created",
        {
          thread_id: stageEvent.payload.id,
          title: stageEvent.payload.title,
          original_intent_redacted: redactIntentText(stageEvent.payload.originalIntent),
          source: "simulated_stage_shell"
        },
        stageEvent.payload.id
      );
    case "object.created":
    case "object.updated":
      return createResearchEvent(
        sessionId,
        stageEvent.type === "object.created" ? "render_object_created" : "render_object_updated",
        {
          object_id: stageEvent.payload.id,
          object_type: stageEvent.payload.type,
          title: stageEvent.payload.title,
          state: stageEvent.payload.state,
          pinned: stageEvent.payload.pinned ?? false,
          position: stageEvent.payload.position,
          source_event_id: stageEvent.payload.id
        },
        stageEvent.payload.threadId
      );
    case "agent.progress":
      return createResearchEvent(
        sessionId,
        "agent_event",
        {
          agent_event_id: stageEvent.payload.id,
          task_id: stageEvent.payload.taskId,
          agent_name: stageEvent.payload.agentName,
          event_type: stageEvent.payload.type,
          summary: stageEvent.payload.summary,
          evidence_count: stageEvent.payload.evidence?.length ?? 0
        },
        stageEvent.payload.threadId
      );
    case "approval.requested":
      return createResearchEvent(
        sessionId,
        "approval_requested",
        {
          approval_id: stageEvent.payload.id,
          action_type: stageEvent.payload.actionType,
          risk_level: stageEvent.payload.riskLevel,
          scope: stageEvent.payload.scope
        },
        stageEvent.payload.threadId
      );
    case "approval.resolved":
      return createResearchEvent(
        sessionId,
        "approval_resolved",
        {
          approval_id: stageEvent.payload.approvalId,
          status: stageEvent.payload.status,
          user_requested_explanation: stageEvent.payload.userRequestedExplanation
        },
        stageEvent.payload.threadId
      );
    case "artifact.created":
    case "artifact.updated":
      return createResearchEvent(
        sessionId,
        stageEvent.type === "artifact.created" ? "artifact_created" : "artifact_updated",
        {
          artifact_id: stageEvent.payload.id,
          artifact_type: stageEvent.payload.type,
          title: stageEvent.payload.title,
          status: stageEvent.payload.status,
          provenance_count: stageEvent.payload.provenance.length
        },
        stageEvent.payload.threadId
      );
    case "artifact.exported":
      return createResearchEvent(
        sessionId,
        "artifact_exported",
        {
          artifact_id: stageEvent.payload.artifactId,
          title: stageEvent.payload.title,
          format: stageEvent.payload.format,
          exported_at: stageEvent.payload.exportedAt
        },
        stageEvent.payload.threadId
      );
    case "user.intervention":
      return createResearchEvent(
        sessionId,
        "user_intervention",
        {
          intervention_id: stageEvent.payload.interventionId,
          intervention_type: stageEvent.payload.interventionType,
          command_action: stageEvent.payload.commandAction,
          command_text_redacted: stageEvent.payload.commandText
            ? redactIntentText(stageEvent.payload.commandText)
            : undefined,
          target_object_id: stageEvent.payload.targetObjectId
        },
        stageEvent.payload.threadId
      );
    case "session.exported":
      return createResearchEvent(
        sessionId,
        "session_exported",
        {
          exported_at: stageEvent.payload.exportedAt,
          event_count: stageEvent.payload.eventCount
        },
        stageEvent.payload.threadId
      );
    default:
      return undefined;
  }
}

function readExtension(fileName: string): string {
  const extension = fileName.split(".").pop();

  return extension && extension !== fileName ? extension.toLowerCase() : "unknown";
}
