import {
  inspectVoiceCapturePreflight,
  type VoiceCapturePermissionState,
  type VoiceCapturePreflight
} from "@blackstage/voice-core";

export type StageWebRealtimeMicPreflightOptions = {
  explicitUserGesture?: boolean;
  realtimeApprovalArmed?: boolean;
  navigatorLike?: StageWebRealtimeMicNavigator;
};

type StageWebRealtimeMicNavigator = {
  mediaDevices?: {
    getUserMedia?: unknown;
  };
  permissions?: {
    query?: (descriptor: { name: string }) => Promise<{ state?: string }>;
  };
};

export function createDefaultStageWebRealtimeMicPreflight(): VoiceCapturePreflight {
  return inspectVoiceCapturePreflight({
    mediaDevicesAvailable: false,
    getUserMediaAvailable: false,
    permissionState: "unknown",
    explicitUserGesture: false,
    realtimeApprovalArmed: false
  });
}

export async function checkStageWebRealtimeMicPreflight(
  options: StageWebRealtimeMicPreflightOptions = {}
): Promise<VoiceCapturePreflight> {
  const navigatorLike = options.navigatorLike ?? readNavigatorLike();
  const permissionState = await readMicrophonePermissionState(navigatorLike);

  return inspectVoiceCapturePreflight({
    mediaDevicesAvailable: Boolean(navigatorLike?.mediaDevices),
    getUserMediaAvailable:
      typeof navigatorLike?.mediaDevices?.getUserMedia === "function",
    permissionState,
    explicitUserGesture: options.explicitUserGesture,
    realtimeApprovalArmed: options.realtimeApprovalArmed
  });
}

async function readMicrophonePermissionState(
  navigatorLike: StageWebRealtimeMicNavigator | undefined
): Promise<VoiceCapturePermissionState> {
  const query = navigatorLike?.permissions?.query;

  if (!query) {
    return "unknown";
  }

  try {
    const status = await query({ name: "microphone" });

    return parseMicrophonePermissionState(status.state);
  } catch {
    return "unknown";
  }
}

function parseMicrophonePermissionState(
  value: string | undefined
): VoiceCapturePermissionState {
  return value === "granted" || value === "prompt" || value === "denied"
    ? value
    : "unknown";
}

function readNavigatorLike(): StageWebRealtimeMicNavigator | undefined {
  return typeof navigator === "undefined"
    ? undefined
    : (navigator as StageWebRealtimeMicNavigator);
}
