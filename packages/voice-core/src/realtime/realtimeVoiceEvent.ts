export type RealtimeVoiceEvent =
  | { type: "voice.capture_started"; timestamp: string }
  | { type: "voice.partial_transcript"; text: string; timestamp: string }
  | { type: "voice.final_transcript"; text: string; timestamp: string }
  | { type: "voice.capture_stopped"; timestamp: string };
