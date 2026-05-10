export type VoiceCaptureStatus = "unavailable" | "idle" | "listening" | "paused";

export type VoiceCaptureState = {
  status: VoiceCaptureStatus;
  deviceLabel?: string;
};
