export type VoiceCaptureStatus = "unavailable" | "idle" | "listening" | "paused";

export type VoiceCaptureState = {
  status: VoiceCaptureStatus;
  deviceLabel?: string;
};

export type VoiceCapturePermissionState = "granted" | "prompt" | "denied" | "unknown";

export type VoiceCapturePreflightStatus =
  | "unavailable"
  | "blocked"
  | "needs_user_gesture"
  | "needs_permission"
  | "ready";

export type VoiceCapturePreflightInput = {
  mediaDevicesAvailable?: boolean;
  getUserMediaAvailable?: boolean;
  permissionState?: VoiceCapturePermissionState;
  explicitUserGesture?: boolean;
  realtimeApprovalArmed?: boolean;
};

export type VoiceCapturePreflight = {
  status: VoiceCapturePreflightStatus;
  browserCanRequestMicrophone: boolean;
  startsMediaStream: false;
  browserSendsAudioToProvider: false;
  requiresUserGesture: true;
  requiresRealtimeApproval: true;
  permissionState: VoiceCapturePermissionState;
  warnings: string[];
};

export type VoiceCaptureStartPlan = {
  mode: "browser_microphone";
  startsMediaStream: true;
  browserSendsAudioToProvider: false;
  requiresUserGesture: true;
  requiresRealtimeApproval: true;
  permissionState: "granted";
  handoff: "local_webrtc_track_only";
};

export function inspectVoiceCapturePreflight(
  input: VoiceCapturePreflightInput = {}
): VoiceCapturePreflight {
  const permissionState = input.permissionState ?? "unknown";
  const warnings: string[] = [];

  if (input.mediaDevicesAvailable === false || input.getUserMediaAvailable === false) {
    warnings.push("Browser microphone APIs are unavailable.");

    return createVoiceCapturePreflight({
      status: "unavailable",
      permissionState,
      warnings
    });
  }

  if (permissionState === "denied") {
    warnings.push("Microphone permission is denied.");

    return createVoiceCapturePreflight({
      status: "blocked",
      permissionState,
      warnings
    });
  }

  if (input.explicitUserGesture !== true) {
    warnings.push("Microphone capture requires an explicit user gesture.");

    return createVoiceCapturePreflight({
      status: "needs_user_gesture",
      permissionState,
      warnings
    });
  }

  if (input.realtimeApprovalArmed !== true) {
    warnings.push("Realtime voice approval is not armed.");

    return createVoiceCapturePreflight({
      status: "needs_permission",
      permissionState,
      warnings
    });
  }

  if (permissionState !== "granted") {
    warnings.push("Microphone permission has not been granted yet.");

    return createVoiceCapturePreflight({
      status: "needs_permission",
      permissionState,
      warnings
    });
  }

  return createVoiceCapturePreflight({
    status: "ready",
    browserCanRequestMicrophone: true,
    permissionState,
    warnings
  });
}

export function createVoiceCaptureStartPlan(
  preflight: VoiceCapturePreflight
): VoiceCaptureStartPlan {
  if (preflight.status !== "ready") {
    throw new Error("Microphone capture is not ready.");
  }

  return {
    mode: "browser_microphone",
    startsMediaStream: true,
    browserSendsAudioToProvider: false,
    requiresUserGesture: true,
    requiresRealtimeApproval: true,
    permissionState: "granted",
    handoff: "local_webrtc_track_only"
  };
}

function createVoiceCapturePreflight(input: {
  status: VoiceCapturePreflightStatus;
  browserCanRequestMicrophone?: boolean;
  permissionState: VoiceCapturePermissionState;
  warnings: string[];
}): VoiceCapturePreflight {
  return {
    status: input.status,
    browserCanRequestMicrophone: input.browserCanRequestMicrophone ?? false,
    startsMediaStream: false,
    browserSendsAudioToProvider: false,
    requiresUserGesture: true,
    requiresRealtimeApproval: true,
    permissionState: input.permissionState,
    warnings: input.warnings
  };
}
