import {
  createRealtimeVoiceBrokerPlan,
  inspectRealtimeVoiceBrokerReadiness,
  type RealtimeVoiceBrokerPlan
} from "./realtimeVoiceBroker.js";
import {
  DEFAULT_REALTIME_VOICE_MODEL,
  type RealtimeVoiceSessionConfig
} from "./realtimeVoiceSession.js";

export const BLACKSTAGE_REALTIME_BROKER_ROUTE = "/api/blackstage/realtime/session";
export const OPENAI_API_KEY_ENV_VAR = "OPENAI_API_KEY";

export type RealtimeUnifiedWebrtcBrokerInput = {
  requestedAt: string;
  safetyIdentifier?: string;
  clientSdpOffer?: string;
  liveModeEnabled?: boolean;
  standardApiKeyAvailable?: boolean;
  serverRoute?: string;
};

export type RealtimeServerSessionDescriptor = {
  type: "realtime";
  model: typeof DEFAULT_REALTIME_VOICE_MODEL;
  instructions: string;
  audio: {
    input: {
      transcription: {
        model: RealtimeVoiceSessionConfig["inputTranscription"]["model"];
        language?: string;
      };
    };
    output: {
      voice: string;
    };
  };
  reasoning: {
    effort: RealtimeVoiceSessionConfig["reasoningEffort"];
  };
};

export type RealtimeUnifiedWebrtcClientContract = {
  method: "POST";
  path: string;
  requestContentType: "application/sdp";
  responseContentType: "application/sdp";
  browserSends: "sdp_offer_only";
  browserReceives: "sdp_answer_only";
  browserReceivesStandardApiKey: false;
  browserReceivesSafetyIdentifier: false;
};

export type RealtimeUnifiedWebrtcOpenAiRequest = {
  method: "POST";
  endpointPath: "/v1/realtime/calls";
  authorization: {
    source: "server_environment";
    envVar: typeof OPENAI_API_KEY_ENV_VAR;
    exposedToBrowser: false;
  };
  safetyIdentifier: string;
  body: {
    kind: "multipart_form_data";
    sdp: string;
    session: RealtimeServerSessionDescriptor;
  };
};

export type RealtimeUnifiedWebrtcBrokerRequest =
  | {
      enabled: false;
      requestedAt: string;
      clientContract: RealtimeUnifiedWebrtcClientContract;
      blockedReasons: string[];
    }
  | {
      enabled: true;
      requestedAt: string;
      clientContract: RealtimeUnifiedWebrtcClientContract;
      blockedReasons: [];
      plan: RealtimeVoiceBrokerPlan;
      openAiRequest: RealtimeUnifiedWebrtcOpenAiRequest;
    };

export function createRealtimeUnifiedWebrtcBrokerRequest(
  config: RealtimeVoiceSessionConfig,
  input: RealtimeUnifiedWebrtcBrokerInput
): RealtimeUnifiedWebrtcBrokerRequest {
  const clientContract = createClientContract(input.serverRoute);
  const readiness = inspectRealtimeVoiceBrokerReadiness(config, {
    safetyIdentifier: input.safetyIdentifier
  });
  const blockedReasons = [...readiness.warnings, ...inspectLiveGate(config, input)];

  if (blockedReasons.length > 0) {
    return {
      enabled: false,
      requestedAt: input.requestedAt,
      clientContract,
      blockedReasons
    };
  }

  const safetyIdentifier = input.safetyIdentifier ?? "";
  const clientSdpOffer = input.clientSdpOffer ?? "";
  const plan = createRealtimeVoiceBrokerPlan(config, {
    requestedAt: input.requestedAt,
    safetyIdentifier,
    brokerMode: "server_unified_webrtc"
  });

  return {
    enabled: true,
    requestedAt: input.requestedAt,
    clientContract,
    blockedReasons: [],
    plan,
    openAiRequest: {
      method: "POST",
      endpointPath: "/v1/realtime/calls",
      authorization: {
        source: "server_environment",
        envVar: OPENAI_API_KEY_ENV_VAR,
        exposedToBrowser: false
      },
      safetyIdentifier,
      body: {
        kind: "multipart_form_data",
        sdp: clientSdpOffer,
        session: createRealtimeServerSessionDescriptor(config)
      }
    }
  };
}

export function createRealtimeServerSessionDescriptor(
  config: RealtimeVoiceSessionConfig
): RealtimeServerSessionDescriptor {
  return {
    type: "realtime",
    model: DEFAULT_REALTIME_VOICE_MODEL,
    instructions: config.instructions,
    audio: {
      input: {
        transcription: {
          model: config.inputTranscription.model,
          language: config.inputTranscription.language
        }
      },
      output: {
        voice: config.voiceName ?? "marin"
      }
    },
    reasoning: {
      effort: config.reasoningEffort
    }
  };
}

function createClientContract(
  serverRoute?: string
): RealtimeUnifiedWebrtcClientContract {
  return {
    method: "POST",
    path: serverRoute ?? BLACKSTAGE_REALTIME_BROKER_ROUTE,
    requestContentType: "application/sdp",
    responseContentType: "application/sdp",
    browserSends: "sdp_offer_only",
    browserReceives: "sdp_answer_only",
    browserReceivesStandardApiKey: false,
    browserReceivesSafetyIdentifier: false
  };
}

function inspectLiveGate(
  config: RealtimeVoiceSessionConfig,
  input: RealtimeUnifiedWebrtcBrokerInput
): string[] {
  const blockedReasons: string[] = [];

  if (!input.liveModeEnabled) {
    blockedReasons.push("Live realtime broker is disabled by default.");
  }

  if (config.networkMode !== "configured_live") {
    blockedReasons.push("Realtime session config is still in simulation mode.");
  }

  if (!input.standardApiKeyAvailable) {
    blockedReasons.push(`Server is missing ${OPENAI_API_KEY_ENV_VAR}.`);
  }

  if (!input.clientSdpOffer?.trim()) {
    blockedReasons.push(
      "Browser SDP offer is required before opening a realtime call."
    );
  }

  return blockedReasons;
}
