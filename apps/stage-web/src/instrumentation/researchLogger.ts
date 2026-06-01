import type {
  IntentThread,
  ResearchEvent,
  ResearchEventType,
  StageEvent,
  StageMorphFrame
} from "@blackstage/stage-core";
import { createStageMorphFrame } from "@blackstage/stage-core";
import { redactIntentText } from "./redaction";

type MorphologyResearchPayload = {
  render_schema: "blackstage.stage_morph_frame.v0";
  frame_sequence: number;
  stage_event_count: number;
  source_event_type: StageEvent["type"] | "none";
  phase: StageMorphFrame["activePhaseId"];
  mode: StageMorphFrame["mode"];
  voice_cadence: StageMorphFrame["nucleus"]["voice"]["cadence"];
  voice_energy: number;
  workbench_state: StageMorphFrame["workbench"]["state"];
  workbench_artifact_count: number;
  orbit_count: number;
  socket_count: number;
  patch_count: number;
  phase_count: number;
  active_socket_count: number;
  approval_ritual_state:
    | NonNullable<StageMorphFrame["approvalRitual"]>["status"]
    | "none";
  approval_risk_level:
    | NonNullable<StageMorphFrame["approvalRitual"]>["riskLevel"]
    | "none";
  camera_depth: number;
  camera_tilt: number;
  socket_roles: StageMorphFrame["sockets"][number]["role"][];
  patch_statuses: Record<string, number>;
};

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
          preview_available: stageEvent.payload.previewAvailable ?? false,
          image_dimensions: stageEvent.payload.imageDimensions,
          structured_kind: stageEvent.payload.structuredKind,
          structured_item_count: stageEvent.payload.structuredItemCount,
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
        stageEvent.type === "object.created"
          ? "render_object_created"
          : "render_object_updated",
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
        stageEvent.type === "artifact.created"
          ? "artifact_created"
          : "artifact_updated",
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
    case "assistant.speech":
      return createResearchEvent(
        sessionId,
        "assistant_speech",
        {
          speech_id: stageEvent.payload.speechId,
          source: stageEvent.payload.source,
          speech_text_redacted: redactIntentText(stageEvent.payload.text),
          speech_length: stageEvent.payload.text.length
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
          command_input_mode: stageEvent.payload.commandInputMode,
          command_text_redacted: stageEvent.payload.commandText
            ? redactIntentText(stageEvent.payload.commandText)
            : undefined,
          command_value_redacted: stageEvent.payload.commandValue
            ? redactIntentText(stageEvent.payload.commandValue)
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

export function researchEventFromMorphologyFrame(
  sessionId: string,
  thread: IntentThread,
  stageEvents: StageEvent[]
): ResearchEvent | undefined {
  if (stageEvents.length === 0) {
    return undefined;
  }

  const frame = createStageMorphFrame(stageEvents, thread);

  return createResearchEvent(
    sessionId,
    "morphology_frame_captured",
    createMorphologyResearchPayload(frame, stageEvents),
    thread.id
  );
}

export function hasResearchEventForMorphologyFrame(
  researchEvent: ResearchEvent,
  sessionId: string,
  threadId: string,
  stageEventCount: number
): boolean {
  if (
    researchEvent.sessionId !== sessionId ||
    researchEvent.threadId !== threadId ||
    researchEvent.eventType !== "morphology_frame_captured"
  ) {
    return false;
  }

  const payload = researchEvent.payload as Partial<MorphologyResearchPayload>;

  return payload.stage_event_count === stageEventCount;
}

function readExtension(fileName: string): string {
  const extension = fileName.split(".").pop();

  return extension && extension !== fileName ? extension.toLowerCase() : "unknown";
}

function createMorphologyResearchPayload(
  frame: StageMorphFrame,
  stageEvents: StageEvent[]
): MorphologyResearchPayload {
  const patchStatuses = frame.patches.reduce<Record<string, number>>(
    (counts, patch) => {
      counts[patch.status] = (counts[patch.status] ?? 0) + 1;

      return counts;
    },
    {}
  );
  const socketRoles = Array.from(
    new Set(frame.sockets.map((socket) => socket.role))
  ).sort();

  return {
    render_schema: "blackstage.stage_morph_frame.v0",
    frame_sequence: stageEvents.length,
    stage_event_count: stageEvents.length,
    source_event_type: stageEvents.at(-1)?.type ?? "none",
    phase: frame.activePhaseId,
    mode: frame.mode,
    voice_cadence: frame.nucleus.voice.cadence,
    voice_energy: roundMetric(frame.nucleus.voice.energy),
    workbench_state: frame.workbench.state,
    workbench_artifact_count: frame.patches.filter(
      (patch) =>
        patch.source === "artifact.created" || patch.source === "artifact.updated"
    ).length,
    orbit_count: frame.orbit.length,
    socket_count: frame.sockets.length,
    patch_count: frame.patches.length,
    phase_count: frame.phases.length,
    active_socket_count: frame.sockets.filter((socket) => socket.state !== "empty")
      .length,
    approval_ritual_state: frame.approvalRitual?.status ?? "none",
    approval_risk_level: frame.approvalRitual?.riskLevel ?? "none",
    camera_depth: roundMetric(frame.camera.depth),
    camera_tilt: roundMetric(frame.camera.tilt),
    socket_roles: socketRoles,
    patch_statuses: patchStatuses
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
