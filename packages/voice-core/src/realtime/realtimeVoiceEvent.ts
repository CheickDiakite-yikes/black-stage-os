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
