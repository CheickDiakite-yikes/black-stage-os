export const DEFAULT_REALTIME_VOICE_MODEL = "gpt-realtime-2";

export type RealtimeVoiceModel =
  | typeof DEFAULT_REALTIME_VOICE_MODEL
  | "gpt-realtime-mini"
  | "gpt-realtime-1.5";

export type RealtimeVoiceTransport = "webrtc" | "websocket";

export type RealtimeVoiceNetworkMode = "simulation" | "configured_live";

export type RealtimeVoiceReasoningEffort = "low" | "medium" | "high";

export type RealtimeVoicePolicy = {
  requiresServerBroker: true;
  forbidsBrowserApiKey: true;
  toolCallsRequireStageApproval: true;
  transcriptStorage: "redacted_events_only" | "local_full_transcript";
};

export type RealtimeVoiceSessionConfig = {
  sessionId: string;
  threadId: string;
  model: RealtimeVoiceModel;
  transport: RealtimeVoiceTransport;
  networkMode: RealtimeVoiceNetworkMode;
  instructions: string;
  voiceName?: string;
  reasoningEffort: RealtimeVoiceReasoningEffort;
  inputModalities: Array<"audio" | "text" | "image">;
  outputModalities: Array<"audio" | "text">;
  policy: RealtimeVoicePolicy;
};

export type RealtimeVoiceSessionInput = {
  sessionId: string;
  threadId: string;
  instructions?: string;
  model?: RealtimeVoiceModel;
  transport?: RealtimeVoiceTransport;
  networkMode?: RealtimeVoiceNetworkMode;
};

export type RealtimeVoiceSessionSafetyReport = {
  safeForBrowser: boolean;
  networkEnabled: boolean;
  warnings: string[];
};

export function createRealtimeVoiceSessionConfig(
  input: RealtimeVoiceSessionInput
): RealtimeVoiceSessionConfig {
  return {
    sessionId: input.sessionId,
    threadId: input.threadId,
    model: input.model ?? DEFAULT_REALTIME_VOICE_MODEL,
    transport: input.transport ?? "webrtc",
    networkMode: input.networkMode ?? "simulation",
    instructions:
      input.instructions ??
      "Listen for intent, speak sparingly, and route all consequential actions through Stage approvals.",
    reasoningEffort: "medium",
    inputModalities: ["audio", "text", "image"],
    outputModalities: ["audio", "text"],
    policy: {
      requiresServerBroker: true,
      forbidsBrowserApiKey: true,
      toolCallsRequireStageApproval: true,
      transcriptStorage: "redacted_events_only"
    }
  };
}

export function inspectRealtimeVoiceSessionSafety(
  config: RealtimeVoiceSessionConfig
): RealtimeVoiceSessionSafetyReport {
  const warnings: string[] = [];

  if (!config.policy.requiresServerBroker) {
    warnings.push("Realtime voice must use a server broker before live browser use.");
  }

  if (!config.policy.forbidsBrowserApiKey) {
    warnings.push("Browser clients must not receive long-lived API keys.");
  }

  if (!config.policy.toolCallsRequireStageApproval) {
    warnings.push("Realtime tool calls must route through Stage approval gates.");
  }

  return {
    safeForBrowser:
      config.policy.requiresServerBroker &&
      config.policy.forbidsBrowserApiKey &&
      config.policy.toolCallsRequireStageApproval,
    networkEnabled: config.networkMode === "configured_live",
    warnings
  };
}
