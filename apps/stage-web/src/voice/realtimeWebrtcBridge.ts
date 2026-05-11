import type { StageEvent } from "@blackstage/stage-core";
import {
  exchangeRealtimeWebrtcSdp,
  BLACKSTAGE_REALTIME_APPROVAL_HEADER,
  mapRealtimeVoiceEventToStageEvents,
  parseRealtimeVoiceServerEvent,
  type RealtimeBrokerClientReadiness,
  type RealtimeWebrtcPeerConnection,
  type RealtimeWebrtcPeerConnectionFactory
} from "@blackstage/voice-core";

export const STAGE_WEB_REALTIME_WEBRTC_ENABLED_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED";
export const STAGE_WEB_REALTIME_APPROVAL_TOKEN_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN";

export type StageWebRealtimeBridgeStatus =
  | "disabled"
  | "connecting"
  | "blocked"
  | "connected"
  | "failed";

export type StageWebRealtimeBridgeState = {
  status: StageWebRealtimeBridgeStatus;
  routeUrl?: string;
  checkedAt: string;
  networkAttempted: boolean;
  peerConnectionCreated: boolean;
  dataChannelName: "oai-events";
  browserSendsAudio: false;
  browserReceivesStandardApiKey: false;
  errors: string[];
};

export type StageWebRealtimeBridgeResult = {
  state: StageWebRealtimeBridgeState;
  stageEvents: StageEvent[];
};

export type StageWebRealtimeBridgeOptions = {
  readiness: RealtimeBrokerClientReadiness;
  threadId: string;
  sessionId: string;
  enabled?: boolean;
  createPeerConnection?: RealtimeWebrtcPeerConnectionFactory;
  fetchImpl?: typeof fetch;
  approvalPhrase?: string;
  now?: () => string;
  emitStageEvents?: (events: StageEvent[]) => void;
};

export type StageWebRealtimeBridgeMappingContext = {
  threadId: string;
  sessionId: string;
  now?: () => string;
};

export function createDefaultStageWebRealtimeBridgeState(
  checkedAt = new Date().toISOString()
): StageWebRealtimeBridgeState {
  return {
    status: "disabled",
    checkedAt,
    networkAttempted: false,
    peerConnectionCreated: false,
    dataChannelName: "oai-events",
    browserSendsAudio: false,
    browserReceivesStandardApiKey: false,
    errors: []
  };
}

export function createStageWebRealtimeBridgeConnectingState(
  routeUrl: string,
  checkedAt = new Date().toISOString()
): StageWebRealtimeBridgeState {
  return {
    status: "connecting",
    routeUrl,
    checkedAt,
    networkAttempted: false,
    peerConnectionCreated: false,
    dataChannelName: "oai-events",
    browserSendsAudio: false,
    browserReceivesStandardApiKey: false,
    errors: []
  };
}

export function shouldStartStageWebRealtimeBridge(
  readiness: RealtimeBrokerClientReadiness,
  enabled = readStageWebRealtimeWebrtcEnabled()
): boolean {
  return enabled === true && readiness.status === "reachable" && readiness.liveModeEnabled === true;
}

export async function startStageWebRealtimeBridge(
  options: StageWebRealtimeBridgeOptions
): Promise<StageWebRealtimeBridgeResult> {
  const timestamp = options.now?.() ?? new Date().toISOString();
  const emitStageEvents = options.emitStageEvents ?? (() => undefined);
  const createPeerConnection =
    options.createPeerConnection ??
    (() =>
      createBrowserRealtimePeerConnection((message) => {
        const events = mapRealtimeDataChannelMessageToStageEvents(message, {
          threadId: options.threadId,
          sessionId: options.sessionId,
          now: options.now
        });

        if (events.length > 0) {
          emitStageEvents(events);
        }
      }));
  const exchange = await exchangeRealtimeWebrtcSdp({
    enabled: options.enabled ?? readStageWebRealtimeWebrtcEnabled(),
    readiness: options.readiness,
    createPeerConnection,
    fetchBrokerAnswer: async (request) => {
      const approvalPhrase =
        options.approvalPhrase ?? readStageWebRealtimeApprovalPhrase();
      const headers = approvalPhrase
        ? {
            ...request.headers,
            [BLACKSTAGE_REALTIME_APPROVAL_HEADER]: approvalPhrase
          }
        : request.headers;
      const response = await (options.fetchImpl ?? fetch)(request.routeUrl, {
        method: "POST",
        headers,
        body: request.offerSdp,
        credentials: "omit"
      });

      return {
        status: response.status,
        answerSdp: await response.text()
      };
    }
  });
  const stageEvents = createRealtimeBridgeStageEvents(exchange.status, {
    threadId: options.threadId,
    routeUrl: exchange.routeUrl,
    timestamp,
    errors: exchange.errors
  });

  return {
    state: {
      status: exchange.status,
      routeUrl: exchange.routeUrl,
      checkedAt: timestamp,
      networkAttempted: exchange.networkAttempted,
      peerConnectionCreated: exchange.peerConnectionCreated,
      dataChannelName: exchange.dataChannelName,
      browserSendsAudio: exchange.browserSendsAudio,
      browserReceivesStandardApiKey: exchange.browserReceivesStandardApiKey,
      errors: exchange.errors
    },
    stageEvents
  };
}

export function mapRealtimeDataChannelMessageToStageEvents(
  message: unknown,
  context: StageWebRealtimeBridgeMappingContext
): StageEvent[] {
  const parsedMessage = parseRealtimeDataChannelPayload(message);
  const realtimeEvent = parseRealtimeVoiceServerEvent(
    parsedMessage,
    context.now?.() ?? new Date().toISOString()
  );

  return realtimeEvent
    ? mapRealtimeVoiceEventToStageEvents(realtimeEvent, {
        threadId: context.threadId,
        sessionId: context.sessionId,
        eventIdPrefix: "stage_web_realtime"
      })
    : [];
}

export function readStageWebRealtimeWebrtcEnabled(
  value = readStageWebRealtimeWebrtcEnvValue()
): boolean {
  return value?.trim() === "1";
}

export function readStageWebRealtimeApprovalPhrase(
  value = readStageWebRealtimeApprovalEnvValue()
): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue || undefined;
}

function createBrowserRealtimePeerConnection(
  onMessage: (message: unknown) => void
): RealtimeWebrtcPeerConnection {
  const PeerConnection = globalThis.RTCPeerConnection;

  if (!PeerConnection) {
    throw new Error("Browser WebRTC peer connection is unavailable.");
  }

  const peerConnection = new PeerConnection();

  return {
    createDataChannel(label) {
      const channel = peerConnection.createDataChannel(label);

      channel.addEventListener("message", (event) => {
        onMessage(event.data);
      });

      return {
        label: channel.label
      };
    },
    async createOffer() {
      const offer = await peerConnection.createOffer();

      return {
        type: "offer",
        sdp: offer.sdp ?? ""
      };
    },
    async setLocalDescription(description) {
      await peerConnection.setLocalDescription(description);
    },
    async setRemoteDescription(description) {
      await peerConnection.setRemoteDescription(description);
    },
    close() {
      peerConnection.close();
    }
  };
}

function parseRealtimeDataChannelPayload(message: unknown): unknown {
  if (typeof message !== "string") {
    return message;
  }

  try {
    return JSON.parse(message);
  } catch {
    return undefined;
  }
}

function createRealtimeBridgeStageEvents(
  status: StageWebRealtimeBridgeStatus,
  input: {
    threadId: string;
    timestamp: string;
    routeUrl?: string;
    errors: string[];
  }
): StageEvent[] {
  if (status === "blocked" && input.errors.some((error) => error.includes("disabled by default"))) {
    return [];
  }

  const eventType =
    status === "connected" ? "started" : status === "failed" ? "failed" : "blocked";

  return [
    {
      type: "agent.progress",
      payload: {
        id: `realtime_bridge_${status}_${stableHash(`${input.threadId}:${input.timestamp}`)}`,
        threadId: input.threadId,
        taskId: "realtime_sdp_bridge",
        agentName: "Realtime voice broker",
        type: eventType,
        summary:
          status === "connected"
            ? "Realtime SDP bridge connected."
            : status === "failed"
              ? "Realtime SDP bridge failed."
              : "Realtime SDP bridge blocked.",
        details:
          status === "connected"
            ? "The browser exchanged SDP through the local broker without receiving a standard API key or sending audio."
            : input.errors.join(" "),
        evidence: input.routeUrl
          ? [
              {
                id: `realtime_bridge_route_${stableHash(input.routeUrl)}`,
                label: "Broker route",
                sourceType: "url",
                uri: input.routeUrl
              }
            ]
          : undefined,
        timestamp: input.timestamp
      }
    }
  ];
}

function readStageWebRealtimeWebrtcEnvValue(): string | undefined {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeWebrtcEnabled?: string;
  };

  if (runtimeConfig.__blackstageRealtimeWebrtcEnabled) {
    return runtimeConfig.__blackstageRealtimeWebrtcEnabled;
  }

  try {
    const localEnabled = localStorage.getItem("blackstage.realtimeWebrtc.enabled");

    if (localEnabled) {
      return localEnabled;
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_REALTIME_WEBRTC_ENABLED_ENV_VAR];
}

function readStageWebRealtimeApprovalEnvValue(): string | undefined {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeApprovalPhrase?: string;
  };

  if (runtimeConfig.__blackstageRealtimeApprovalPhrase) {
    return runtimeConfig.__blackstageRealtimeApprovalPhrase;
  }

  try {
    const localPhrase = localStorage.getItem("blackstage.realtime.approvalPhrase");

    if (localPhrase) {
      return localPhrase;
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_REALTIME_APPROVAL_TOKEN_ENV_VAR];
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
