export const DEFAULT_REALTIME_VOICE_MODEL = "gpt-realtime-2";
export const DEFAULT_REALTIME_TRANSCRIPTION_MODEL = "gpt-realtime-whisper";
export const BLACKSTAGE_REALTIME_INSTRUCTIONS_VERSION =
  "blackstage.realtime.instructions.v0";

export type RealtimeVoiceModel =
  | typeof DEFAULT_REALTIME_VOICE_MODEL
  | "gpt-realtime-mini"
  | "gpt-realtime-1.5";

export type RealtimeVoiceTransport = "webrtc" | "websocket";

export type RealtimeVoiceNetworkMode = "simulation" | "configured_live";

export type RealtimeVoiceReasoningEffort = "low" | "medium" | "high";
export type RealtimeVoiceInputTranscriptionModel =
  | typeof DEFAULT_REALTIME_TRANSCRIPTION_MODEL
  | "gpt-4o-mini-transcribe"
  | "gpt-4o-transcribe"
  | "whisper-1";

export type RealtimeVoicePolicy = {
  requiresServerBroker: true;
  forbidsBrowserApiKey: true;
  toolCallsRequireStageApproval: true;
  transcriptStorage: "redacted_events_only" | "local_full_transcript";
};

export type RealtimeVoiceInstructionContract = {
  version: typeof BLACKSTAGE_REALTIME_INSTRUCTIONS_VERSION;
  model: typeof DEFAULT_REALTIME_VOICE_MODEL;
  speechCadence: "sparse_key_turns";
  toolPolicy: "stage_approval_before_execution";
  tracePolicy: "stage_events_only";
  instructions: string;
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
  inputTranscription: {
    model: RealtimeVoiceInputTranscriptionModel;
    language?: string;
  };
  policy: RealtimeVoicePolicy;
};

export type RealtimeVoiceSessionInput = {
  sessionId: string;
  threadId: string;
  instructions?: string;
  model?: RealtimeVoiceModel;
  inputTranscriptionModel?: RealtimeVoiceInputTranscriptionModel;
  inputTranscriptionLanguage?: string;
  transport?: RealtimeVoiceTransport;
  networkMode?: RealtimeVoiceNetworkMode;
};

export type RealtimeVoiceSessionSafetyReport = {
  safeForBrowser: boolean;
  networkEnabled: boolean;
  warnings: string[];
};

export function createBlackstageRealtimeInstructionContract(): RealtimeVoiceInstructionContract {
  return {
    version: BLACKSTAGE_REALTIME_INSTRUCTIONS_VERSION,
    model: DEFAULT_REALTIME_VOICE_MODEL,
    speechCadence: "sparse_key_turns",
    toolPolicy: "stage_approval_before_execution",
    tracePolicy: "stage_events_only",
    instructions: [
      "You are the Blackstage realtime voice edge.",
      "Listen for intent, preserve the calm black-stage atmosphere, and speak only key turns.",
      "Use short spoken confirmations; do not narrate every internal step.",
      "Convert user intent into stage events, visible work, approvals, and artifacts.",
      "Do not execute tools, browse, write files, publish, spend money, or touch memory without a Stage approval event.",
      "When a tool is needed, request approval and wait for the stage to resolve it.",
      "Never expose provider credentials or safety identifiers to the browser.",
      "Keep transcript storage to redacted stage events unless the local operator explicitly enables fuller local transcript capture."
    ].join("\n")
  };
}

export function createRealtimeVoiceSessionConfig(
  input: RealtimeVoiceSessionInput
): RealtimeVoiceSessionConfig {
  const instructionContract = createBlackstageRealtimeInstructionContract();

  return {
    sessionId: input.sessionId,
    threadId: input.threadId,
    model: input.model ?? DEFAULT_REALTIME_VOICE_MODEL,
    transport: input.transport ?? "webrtc",
    networkMode: input.networkMode ?? "simulation",
    instructions: input.instructions ?? instructionContract.instructions,
    reasoningEffort: "medium",
    inputModalities: ["audio", "text", "image"],
    outputModalities: ["audio", "text"],
    inputTranscription: {
      model: input.inputTranscriptionModel ?? DEFAULT_REALTIME_TRANSCRIPTION_MODEL,
      language: input.inputTranscriptionLanguage
    },
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
