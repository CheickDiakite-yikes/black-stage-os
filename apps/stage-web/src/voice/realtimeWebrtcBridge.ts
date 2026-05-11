import type { StageEvent } from "@blackstage/stage-core";
import {
  BLACKSTAGE_REALTIME_APPROVAL_HEADER,
  createVoiceCaptureStartPlan,
  exchangeRealtimeWebrtcSdp,
  mapRealtimeVoiceEventToStageEvents,
  parseRealtimeVoiceServerEvent,
  type RealtimeBrokerClientReadiness,
  type RealtimeWebrtcAudioTrack,
  type RealtimeWebrtcPeerConnection,
  type RealtimeWebrtcPeerConnectionFactory,
  type VoiceCapturePreflight,
  type VoiceCaptureStartPlan
} from "@blackstage/voice-core";

export const STAGE_WEB_REALTIME_WEBRTC_ENABLED_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED";
export const STAGE_WEB_REALTIME_APPROVAL_TOKEN_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN";
export const STAGE_WEB_REALTIME_AUDIO_ENABLED_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED";

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
  browserSendsAudio: boolean;
  browserReceivesStandardApiKey: false;
  errors: string[];
};

export type StageWebRealtimeBridgeResult = {
  state: StageWebRealtimeBridgeState;
  stageEvents: StageEvent[];
  connection?: StageWebRealtimeBridgeConnection;
};

export type StageWebRealtimeBridgeConnection = Pick<
  RealtimeWebrtcPeerConnection,
  "close"
>;

export type StageWebRealtimeBridgeOptions = {
  readiness: RealtimeBrokerClientReadiness;
  threadId: string;
  sessionId: string;
  enabled?: boolean;
  approvedAudioTrack?: RealtimeWebrtcAudioTrack;
  audioTrackApproved?: boolean;
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

export type StageWebRealtimeAudioTrackStatus =
  | "disabled"
  | "blocked"
  | "ready"
  | "failed";

export type StageWebRealtimeAudioTrackResult = {
  status: StageWebRealtimeAudioTrackStatus;
  getUserMediaCalled: boolean;
  startsMediaStream: boolean;
  browserReceivesStandardApiKey: false;
  track?: RealtimeWebrtcAudioTrack;
  startPlan?: VoiceCaptureStartPlan;
  errors: string[];
};

export type StageWebRealtimeAudioTrackOptions = {
  enabled?: boolean;
  preflight: VoiceCapturePreflight;
  navigatorLike?: StageWebRealtimeAudioNavigator;
};

type StageWebRealtimeAudioNavigator = {
  mediaDevices?: {
    getUserMedia?: (constraints: {
      audio: true;
      video: false;
    }) => Promise<StageWebRealtimeAudioStream>;
  };
};

type StageWebRealtimeAudioStream = {
  getAudioTracks?: () => RealtimeWebrtcAudioTrack[];
  getTracks?: () => Array<RealtimeWebrtcAudioTrack | { kind?: string }>;
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
  return (
    enabled === true &&
    readiness.status === "reachable" &&
    readiness.liveModeEnabled === true
  );
}

export async function startStageWebRealtimeBridge(
  options: StageWebRealtimeBridgeOptions
): Promise<StageWebRealtimeBridgeResult> {
  const timestamp = options.now?.() ?? new Date().toISOString();
  const emitStageEvents = options.emitStageEvents ?? (() => undefined);
  let retainedConnection: RealtimeWebrtcPeerConnection | undefined;
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
  const createRetainedPeerConnection = () => {
    retainedConnection = createPeerConnection();

    return retainedConnection;
  };
  const exchange = await exchangeRealtimeWebrtcSdp({
    enabled: options.enabled ?? readStageWebRealtimeWebrtcEnabled(),
    approvedAudioTrack: options.approvedAudioTrack,
    audioTrackApproved: options.audioTrackApproved,
    readiness: options.readiness,
    createPeerConnection: createRetainedPeerConnection,
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
    browserSendsAudio: exchange.browserSendsAudio,
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
    stageEvents,
    connection:
      exchange.status === "connected" ? { close: retainedConnection?.close } : undefined
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

export function readStageWebRealtimeAudioEnabled(
  value = readStageWebRealtimeAudioEnvValue()
): boolean {
  return value?.trim() === "1";
}

export async function prepareStageWebRealtimeAudioTrack(
  options: StageWebRealtimeAudioTrackOptions
): Promise<StageWebRealtimeAudioTrackResult> {
  if (options.enabled !== true) {
    return {
      status: "disabled",
      getUserMediaCalled: false,
      startsMediaStream: false,
      browserReceivesStandardApiKey: false,
      errors: []
    };
  }

  if (options.preflight.status !== "ready") {
    return {
      status: "blocked",
      getUserMediaCalled: false,
      startsMediaStream: false,
      browserReceivesStandardApiKey: false,
      errors: options.preflight.warnings
    };
  }

  const navigatorLike = options.navigatorLike ?? readStageWebRealtimeAudioNavigator();
  const getUserMedia = navigatorLike?.mediaDevices?.getUserMedia;

  if (!getUserMedia) {
    return {
      status: "failed",
      getUserMediaCalled: false,
      startsMediaStream: false,
      browserReceivesStandardApiKey: false,
      errors: ["Browser microphone capture is unavailable."]
    };
  }

  const startPlan = createVoiceCaptureStartPlan(options.preflight);

  try {
    const stream = await getUserMedia({
      audio: true,
      video: false
    });
    const track = readFirstAudioTrack(stream);

    if (!track) {
      return {
        status: "failed",
        getUserMediaCalled: true,
        startsMediaStream: true,
        browserReceivesStandardApiKey: false,
        startPlan,
        errors: ["Browser microphone capture returned no audio track."]
      };
    }

    return {
      status: "ready",
      getUserMediaCalled: true,
      startsMediaStream: true,
      browserReceivesStandardApiKey: false,
      track,
      startPlan,
      errors: []
    };
  } catch (error) {
    return {
      status: "failed",
      getUserMediaCalled: true,
      startsMediaStream: false,
      browserReceivesStandardApiKey: false,
      startPlan,
      errors: [
        error instanceof Error ? error.message : "Browser microphone capture failed."
      ]
    };
  }
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
    },
    addTrack(track) {
      peerConnection.addTrack(track as MediaStreamTrack);
    },
    addTransceiver(kind, init) {
      peerConnection.addTransceiver(kind, init);
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
    browserSendsAudio: boolean;
    routeUrl?: string;
    errors: string[];
  }
): StageEvent[] {
  if (
    status === "blocked" &&
    input.errors.some((error) => error.includes("disabled by default"))
  ) {
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
            ? input.browserSendsAudio
              ? "The browser exchanged SDP through the local broker after attaching an approved local audio track; no standard API key was exposed."
              : "The browser exchanged SDP through the local broker without receiving a standard API key or sending microphone audio."
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

function readFirstAudioTrack(
  stream: StageWebRealtimeAudioStream
): RealtimeWebrtcAudioTrack | undefined {
  const [audioTrack] =
    stream.getAudioTracks?.() ??
    stream
      .getTracks?.()
      .filter((track): track is RealtimeWebrtcAudioTrack => track.kind === "audio") ??
    [];

  return audioTrack;
}

function readStageWebRealtimeAudioNavigator():
  | StageWebRealtimeAudioNavigator
  | undefined {
  return typeof navigator === "undefined"
    ? undefined
    : (navigator as StageWebRealtimeAudioNavigator);
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

function readStageWebRealtimeAudioEnvValue(): string | undefined {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeAudioEnabled?: string;
  };

  if (runtimeConfig.__blackstageRealtimeAudioEnabled) {
    return runtimeConfig.__blackstageRealtimeAudioEnabled;
  }

  try {
    const localEnabled = localStorage.getItem("blackstage.realtimeAudio.enabled");

    if (localEnabled) {
      return localEnabled;
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_REALTIME_AUDIO_ENABLED_ENV_VAR];
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
