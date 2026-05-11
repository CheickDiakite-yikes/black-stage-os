import type { StageEvent } from "@blackstage/stage-core";
import type { RealtimeVoiceEvent } from "./realtimeVoiceEvent.js";

export type RealtimeVoiceStageMappingContext = {
  threadId: string;
  sessionId: string;
  eventIdPrefix?: string;
};

export function mapRealtimeVoiceEventToStageEvents(
  event: RealtimeVoiceEvent,
  context: RealtimeVoiceStageMappingContext
): StageEvent[] {
  switch (event.type) {
    case "voice.session_created":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "session_created", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "started",
            summary: "Realtime session created.",
            details:
              "The Realtime server acknowledged the live session for this intent thread.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.capture_started":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "capture_started", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "started",
            summary: "Realtime voice capture started.",
            details:
              "The voice edge is listening and will route consequential tool calls through Stage approvals.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.partial_transcript":
    case "voice.assistant_delta":
      return [];
    case "voice.final_transcript":
      return [
        {
          type: "intent.submitted",
          payload: {
            rawText: event.text,
            submittedAt: event.timestamp,
            inputMode: "voice"
          }
        }
      ];
    case "voice.assistant_speech":
      return [
        {
          type: "assistant.speech",
          payload: {
            speechId: createEventId(
              context,
              "assistant_speech",
              event.timestamp,
              event.text
            ),
            threadId: context.threadId,
            text: event.text,
            spokenAt: event.timestamp,
            source: "stage_status"
          }
        }
      ];
    case "voice.response_started":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "response_started", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "started",
            summary: "Realtime response started.",
            details:
              "The Realtime server started composing a response for the active stage session.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.response_completed":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "response_completed", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "completed",
            summary: "Realtime response completed.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.output_audio_started":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "output_audio_started", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "started",
            summary: "Realtime assistant audio started.",
            details:
              "The Realtime server began producing assistant audio for the active stage session.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.output_audio_stopped":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "output_audio_stopped", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "completed",
            summary: "Realtime assistant audio stopped.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.output_audio_cleared":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "output_audio_cleared", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "cancelled",
            summary: "Realtime assistant audio cleared.",
            details:
              "The Realtime server cleared pending assistant audio, usually after interruption or an explicit clear.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.tool_call_requested":
      return [
        {
          type: "approval.requested",
          payload: {
            id: `approval_${createEventId(context, "tool_call", event.timestamp, event.callId)}`,
            threadId: context.threadId,
            actionType: "tool_call",
            title: `Approve realtime tool: ${event.toolName}`,
            summary: `Realtime voice requested the ${event.toolName} tool.`,
            riskLevel: "medium",
            proposedBy: "Realtime voice broker",
            scope: "Current intent thread",
            consequence:
              "Blackstage may run the requested tool only after explicit approval.",
            undoPath: "Reject the approval request to leave the tool call unexecuted.",
            status: "pending",
            createdAt: event.timestamp
          }
        }
      ];
    case "voice.capture_stopped":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "capture_stopped", event.timestamp),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "completed",
            summary: "Realtime voice capture stopped.",
            timestamp: event.timestamp
          }
        }
      ];
    case "voice.error":
      return [
        {
          type: "agent.progress",
          payload: {
            id: createEventId(context, "error", event.timestamp, event.message),
            threadId: context.threadId,
            agentName: "Realtime voice broker",
            type: "failed",
            summary: "Realtime voice error.",
            details: event.message,
            timestamp: event.timestamp
          }
        }
      ];
  }
}

function createEventId(
  context: RealtimeVoiceStageMappingContext,
  kind: string,
  timestamp: string,
  value = ""
): string {
  const prefix = context.eventIdPrefix ?? "voice";

  return `${prefix}_${kind}_${stableHash(`${context.sessionId}:${context.threadId}:${timestamp}:${value}`)}`;
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
