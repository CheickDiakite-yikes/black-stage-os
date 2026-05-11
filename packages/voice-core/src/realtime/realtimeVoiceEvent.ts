export type RealtimeVoiceEvent =
  | { type: "voice.capture_started"; timestamp: string }
  | { type: "voice.partial_transcript"; text: string; timestamp: string }
  | { type: "voice.final_transcript"; text: string; timestamp: string }
  | { type: "voice.assistant_delta"; textDelta: string; timestamp: string }
  | { type: "voice.assistant_speech"; text: string; timestamp: string }
  | {
      type: "voice.tool_call_requested";
      callId: string;
      toolName: string;
      requiresApproval: true;
      timestamp: string;
    }
  | { type: "voice.capture_stopped"; timestamp: string }
  | { type: "voice.error"; message: string; timestamp: string };

export function parseRealtimeVoiceServerEvent(
  event: unknown,
  timestamp = new Date().toISOString()
): RealtimeVoiceEvent | undefined {
  if (!isRecord(event) || typeof event.type !== "string") {
    return undefined;
  }

  switch (event.type) {
    case "input_audio_buffer.speech_started":
      return {
        type: "voice.capture_started",
        timestamp
      };
    case "input_audio_buffer.speech_stopped":
      return {
        type: "voice.capture_stopped",
        timestamp
      };
    case "conversation.item.input_audio_transcription.delta":
      return typeof event.delta === "string"
        ? {
            type: "voice.partial_transcript",
            text: event.delta,
            timestamp
          }
        : undefined;
    case "conversation.item.input_audio_transcription.completed":
      return typeof event.transcript === "string"
        ? {
            type: "voice.final_transcript",
            text: event.transcript,
            timestamp
          }
        : undefined;
    case "response.output_text.delta":
    case "response.output_audio_transcript.delta":
      return typeof event.delta === "string"
        ? {
            type: "voice.assistant_delta",
            textDelta: event.delta,
            timestamp
          }
        : undefined;
    case "response.output_text.done":
      return typeof event.text === "string"
        ? {
            type: "voice.assistant_speech",
            text: event.text,
            timestamp
          }
        : undefined;
    case "response.output_audio_transcript.done":
      return typeof event.transcript === "string"
        ? {
            type: "voice.assistant_speech",
            text: event.transcript,
            timestamp
          }
        : undefined;
    case "response.content_part.done": {
      const part = isRecord(event.part) ? event.part : undefined;
      const text =
        part?.type === "audio"
          ? readStringField(part, "transcript")
          : readStringField(part ?? {}, "text");

      return text
        ? {
            type: "voice.assistant_speech",
            text,
            timestamp
          }
        : undefined;
    }
    case "response.function_call_arguments.done": {
      const callId =
        readStringField(event, "call_id") ?? readStringField(event, "callId");
      const toolName = readStringField(event, "name") ?? "unknown_realtime_tool";

      return callId
        ? {
            type: "voice.tool_call_requested",
            callId,
            toolName,
            requiresApproval: true,
            timestamp
          }
        : undefined;
    }
    case "error": {
      const message = isRecord(event.error)
        ? readStringField(event.error, "message")
        : readStringField(event, "message");

      return {
        type: "voice.error",
        message: message ?? "Realtime server error.",
        timestamp
      };
    }
    default:
      return undefined;
  }
}

function readStringField(
  record: Record<string, unknown>,
  field: string
): string | undefined {
  const value = record[field];

  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
