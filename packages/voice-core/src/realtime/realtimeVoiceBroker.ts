import {
  DEFAULT_REALTIME_VOICE_MODEL,
  inspectRealtimeVoiceSessionSafety,
  type RealtimeVoiceSessionConfig
} from "./realtimeVoiceSession.js";

export type RealtimeVoiceBrokerMode =
  | "simulation"
  | "server_unified_webrtc"
  | "server_ephemeral_token";

export type RealtimeVoiceBrokerInput = {
  requestedAt: string;
  safetyIdentifier?: string;
  brokerMode?: RealtimeVoiceBrokerMode;
};

export type RealtimeVoiceBrokerPlan = {
  brokerMode: RealtimeVoiceBrokerMode;
  sessionId: string;
  threadId: string;
  model: typeof DEFAULT_REALTIME_VOICE_MODEL;
  transport: "webrtc";
  requestedAt: string;
  openAiEndpointPath: "/v1/realtime/calls" | "/v1/realtime/client_secrets" | "simulation";
  standardApiKeyLocation: "server_environment_only" | "not_used";
  exposesApiKeyToBrowser: false;
  forwardsClientSdp: boolean;
  safetyIdentifier?: string;
  dataChannelName: "oai-events";
  stageEventPolicy: {
    assistantSpeechEvent: "assistant.speech";
    toolCallsRequireApproval: true;
    transcriptStorage: "redacted_events_only" | "local_full_transcript";
  };
};

export type RealtimeVoiceBrokerInspection = {
  readyForLiveSession: boolean;
  warnings: string[];
};

export function createRealtimeVoiceBrokerPlan(
  config: RealtimeVoiceSessionConfig,
  input: RealtimeVoiceBrokerInput
): RealtimeVoiceBrokerPlan {
  const inspection = inspectRealtimeVoiceBrokerReadiness(config, input);

  if (!inspection.readyForLiveSession && config.networkMode === "configured_live") {
    throw new Error(inspection.warnings.join(" "));
  }

  const brokerMode = input.brokerMode ?? defaultBrokerModeForConfig(config);

  return {
    brokerMode,
    sessionId: config.sessionId,
    threadId: config.threadId,
    model: DEFAULT_REALTIME_VOICE_MODEL,
    transport: "webrtc",
    requestedAt: input.requestedAt,
    openAiEndpointPath: endpointPathForBrokerMode(brokerMode),
    standardApiKeyLocation: brokerMode === "simulation" ? "not_used" : "server_environment_only",
    exposesApiKeyToBrowser: false,
    forwardsClientSdp: brokerMode === "server_unified_webrtc",
    safetyIdentifier: input.safetyIdentifier,
    dataChannelName: "oai-events",
    stageEventPolicy: {
      assistantSpeechEvent: "assistant.speech",
      toolCallsRequireApproval: true,
      transcriptStorage: config.policy.transcriptStorage
    }
  };
}

export function inspectRealtimeVoiceBrokerReadiness(
  config: RealtimeVoiceSessionConfig,
  input: Pick<RealtimeVoiceBrokerInput, "safetyIdentifier"> = {}
): RealtimeVoiceBrokerInspection {
  const sessionSafety = inspectRealtimeVoiceSessionSafety(config);
  const warnings = [...sessionSafety.warnings];

  if (config.model !== DEFAULT_REALTIME_VOICE_MODEL) {
    warnings.push("Blackstage live voice broker is pinned to gpt-realtime-2 for this slice.");
  }

  if (config.transport !== "webrtc") {
    warnings.push("Browser realtime voice must use WebRTC before live connection.");
  }

  if (config.networkMode === "configured_live" && !input.safetyIdentifier) {
    warnings.push("Live realtime voice requires a server-side safety identifier.");
  }

  return {
    readyForLiveSession: warnings.length === 0,
    warnings
  };
}

function defaultBrokerModeForConfig(config: RealtimeVoiceSessionConfig): RealtimeVoiceBrokerMode {
  return config.networkMode === "configured_live" ? "server_unified_webrtc" : "simulation";
}

function endpointPathForBrokerMode(
  brokerMode: RealtimeVoiceBrokerMode
): RealtimeVoiceBrokerPlan["openAiEndpointPath"] {
  switch (brokerMode) {
    case "server_unified_webrtc":
      return "/v1/realtime/calls";
    case "server_ephemeral_token":
      return "/v1/realtime/client_secrets";
    case "simulation":
      return "simulation";
  }
}
