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
export const STAGE_WEB_REALTIME_TEXT_PROBE_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_TEXT_PROBE";
export const STAGE_WEB_REALTIME_TOOL_PROBE_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_TOOL_PROBE";
export const STAGE_WEB_REALTIME_DEBUG_ENABLED_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED";
export const STAGE_WEB_REALTIME_DEBUG_STORAGE_KEY = "blackstage.realtime.debug.events";
export const STAGE_WEB_REALTIME_TOOL_PROBE_NAME = "blackstage_prepare_external_action";

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

export type StageWebRealtimeToolResultInput = {
  callId: string;
  output: Record<string, unknown>;
};

export type StageWebRealtimeBridgeConnection = Pick<
  RealtimeWebrtcPeerConnection,
  "close"
> & {
  sendToolResult?: (input: StageWebRealtimeToolResultInput) => boolean;
};

type StageWebRealtimeWritablePeerConnection = RealtimeWebrtcPeerConnection & {
  sendToolResult?: (input: StageWebRealtimeToolResultInput) => boolean;
};

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

export type StageWebRealtimeAudioTrackStageEventInput = {
  threadId: string;
  timestamp: string;
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
  let retainedConnection: StageWebRealtimeWritablePeerConnection | undefined;
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
    retainedConnection =
      createPeerConnection() as StageWebRealtimeWritablePeerConnection;

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
      exchange.status === "connected"
        ? {
            close: retainedConnection?.close?.bind(retainedConnection),
            sendToolResult: retainedConnection?.sendToolResult?.bind(retainedConnection)
          }
        : undefined
  };
}

export function mapRealtimeDataChannelMessageToStageEvents(
  message: unknown,
  context: StageWebRealtimeBridgeMappingContext
): StageEvent[] {
  const parsedMessage = parseRealtimeDataChannelPayload(message);
  const timestamp = context.now?.() ?? new Date().toISOString();
  const realtimeEvent = parseRealtimeVoiceServerEvent(parsedMessage, timestamp);

  if (realtimeEvent) {
    return mapRealtimeVoiceEventToStageEvents(realtimeEvent, {
      threadId: context.threadId,
      sessionId: context.sessionId,
      eventIdPrefix: "stage_web_realtime"
    });
  }

  const unmappedEvent = createUnmappedRealtimeServerEvent(parsedMessage, {
    ...context,
    timestamp
  });

  return unmappedEvent ? [unmappedEvent] : [];
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

export function createStageWebRealtimeAudioTrackStageEvent(
  result: StageWebRealtimeAudioTrackResult,
  input: StageWebRealtimeAudioTrackStageEventInput
): StageEvent | undefined {
  if (result.status === "disabled") {
    return undefined;
  }

  const eventType =
    result.status === "ready"
      ? "completed"
      : result.status === "failed"
        ? "failed"
        : "blocked";
  const summary =
    result.status === "ready"
      ? "Realtime microphone stream attached."
      : result.status === "failed"
        ? "Realtime microphone stream failed."
        : "Realtime microphone stream blocked.";
  const details =
    result.status === "ready"
      ? "A local microphone track was attached only after Stage approval and browser permission; no standard API key was exposed to the browser."
      : result.errors.join(" ") ||
        "The Realtime bridge continued without attaching local microphone audio.";

  return {
    type: "agent.progress",
    payload: {
      id: `realtime_audio_${result.status}_${stableHash(`${input.threadId}:${input.timestamp}:${summary}`)}`,
      threadId: input.threadId,
      taskId: "realtime_audio_track",
      agentName: "Realtime voice broker",
      type: eventType,
      summary,
      details,
      timestamp: input.timestamp
    }
  };
}

function createBrowserRealtimePeerConnection(
  onMessage: (message: unknown) => void
): StageWebRealtimeWritablePeerConnection {
  const PeerConnection = globalThis.RTCPeerConnection;
  const textProbe = readStageWebRealtimeTextProbe();
  const toolProbe = readStageWebRealtimeToolProbe();
  const debugEnabled = readStageWebRealtimeDebugEnabled();
  const debugStartedAt = Date.now();
  let channel: RTCDataChannel | undefined;
  let toolProbeSent = false;

  if (!PeerConnection) {
    throw new Error("Browser WebRTC peer connection is unavailable.");
  }

  const peerConnection = new PeerConnection();

  return {
    createDataChannel(label) {
      const dataChannel = peerConnection.createDataChannel(label);
      channel = dataChannel;

      dataChannel.addEventListener("message", (event) => {
        recordStageWebRealtimeDebugEvent("server", event.data, {
          enabled: debugEnabled,
          startedAt: debugStartedAt
        });
        onMessage(event.data);
        if (
          toolProbe &&
          !toolProbeSent &&
          realtimeDataChannelMessageEndsResponse(event.data)
        ) {
          toolProbeSent = true;
          sendStageWebRealtimeToolProbe(dataChannel, toolProbe, {
            enabled: debugEnabled,
            startedAt: debugStartedAt
          });
        }
      });
      if (textProbe) {
        dataChannel.addEventListener("open", () => {
          sendStageWebRealtimeTextProbe(dataChannel, textProbe, {
            enabled: debugEnabled,
            startedAt: debugStartedAt
          });
        });
      } else if (toolProbe) {
        dataChannel.addEventListener("open", () => {
          toolProbeSent = true;
          sendStageWebRealtimeToolProbe(dataChannel, toolProbe, {
            enabled: debugEnabled,
            startedAt: debugStartedAt
          });
        });
      }

      return {
        label: dataChannel.label
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
    sendToolResult(input) {
      if (!channel || channel.readyState !== "open") {
        return false;
      }

      sendStageWebRealtimeToolResult(channel, input, {
        enabled: debugEnabled,
        startedAt: debugStartedAt
      });
      return true;
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

function createUnmappedRealtimeServerEvent(
  message: unknown,
  context: StageWebRealtimeBridgeMappingContext & { timestamp: string }
): StageEvent | undefined {
  if (!isRecord(message) || typeof message.type !== "string") {
    return undefined;
  }

  const eventType = sanitizeRealtimeEventType(message.type);

  if (!eventType) {
    return undefined;
  }

  return {
    type: "agent.progress",
    payload: {
      id: `realtime_unmapped_${stableHash(`${context.sessionId}:${context.threadId}:${context.timestamp}:${eventType}`)}`,
      threadId: context.threadId,
      taskId: "realtime_data_channel",
      agentName: "Realtime voice broker",
      type: "progress",
      summary: "Realtime server event observed.",
      details: `Unmapped server event: ${eventType}. Payload was not stored.`,
      timestamp: context.timestamp
    }
  };
}

function sanitizeRealtimeEventType(eventType: string): string {
  return eventType.replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 96);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readStringField(
  record: Record<string, unknown>,
  field: string
): string | undefined {
  const value = record[field];

  return typeof value === "string" ? value : undefined;
}

function readRecordField(
  record: Record<string, unknown>,
  field: string
): Record<string, unknown> | undefined {
  const value = record[field];

  return isRecord(value) ? value : undefined;
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

function readStageWebRealtimeTextProbe(): string | undefined {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeTextProbe?: string;
  };

  if (runtimeConfig.__blackstageRealtimeTextProbe) {
    return normalizeStageWebRealtimeTextProbe(
      runtimeConfig.__blackstageRealtimeTextProbe
    );
  }

  try {
    const localProbe = localStorage.getItem("blackstage.realtime.textProbe");

    if (localProbe) {
      return normalizeStageWebRealtimeTextProbe(localProbe);
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return normalizeStageWebRealtimeTextProbe(
    meta.env?.[STAGE_WEB_REALTIME_TEXT_PROBE_ENV_VAR]
  );
}

function readStageWebRealtimeToolProbe(): string | undefined {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeToolProbe?: string;
  };

  if (runtimeConfig.__blackstageRealtimeToolProbe) {
    return normalizeStageWebRealtimeTextProbe(
      runtimeConfig.__blackstageRealtimeToolProbe
    );
  }

  try {
    const localProbe = localStorage.getItem("blackstage.realtime.toolProbe");

    if (localProbe) {
      return normalizeStageWebRealtimeTextProbe(localProbe);
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return normalizeStageWebRealtimeTextProbe(
    meta.env?.[STAGE_WEB_REALTIME_TOOL_PROBE_ENV_VAR]
  );
}

function readStageWebRealtimeDebugEnabled(): boolean {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeDebugEnabled?: string;
  };

  if (runtimeConfig.__blackstageRealtimeDebugEnabled) {
    return runtimeConfig.__blackstageRealtimeDebugEnabled.trim() === "1";
  }

  try {
    const localEnabled = localStorage.getItem("blackstage.realtimeDebug.enabled");

    if (localEnabled) {
      return localEnabled.trim() === "1";
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_REALTIME_DEBUG_ENABLED_ENV_VAR]?.trim() === "1";
}

function normalizeStageWebRealtimeTextProbe(value?: string): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue.slice(0, 240) : undefined;
}

export type StageWebRealtimeTextProbeClientEvent =
  | {
      type: "conversation.item.create";
      event_id: string;
      item: {
        type: "message";
        role: "user";
        content: Array<{
          type: "input_text";
          text: string;
        }>;
      };
    }
  | {
      type: "response.create";
      event_id: string;
      response: {
        output_modalities: ["text"];
        instructions: string;
        max_output_tokens: 24;
      };
    };

export type StageWebRealtimeToolProbeClientEvent =
  | {
      type: "conversation.item.create";
      event_id: string;
      item: {
        type: "message";
        role: "user";
        content: Array<{
          type: "input_text";
          text: string;
        }>;
      };
    }
  | {
      type: "response.create";
      event_id: string;
      response: {
        output_modalities: ["text"];
        instructions: string;
        tools: Array<{
          type: "function";
          name: typeof STAGE_WEB_REALTIME_TOOL_PROBE_NAME;
          description: string;
          parameters: {
            type: "object";
            additionalProperties: false;
            properties: {
              action: {
                type: "string";
              };
              reason: {
                type: "string";
              };
            };
            required: ["action", "reason"];
          };
        }>;
        tool_choice: {
          type: "function";
          name: typeof STAGE_WEB_REALTIME_TOOL_PROBE_NAME;
        };
        max_output_tokens: 96;
      };
    };

export type StageWebRealtimeToolResultClientEvent =
  | {
      type: "conversation.item.create";
      event_id: string;
      item: {
        type: "function_call_output";
        call_id: string;
        output: string;
      };
    }
  | {
      type: "response.create";
      event_id: string;
      response: {
        output_modalities: ["text"];
        instructions: string;
        max_output_tokens: 48;
      };
    };

export type StageWebRealtimeDebugEvent = {
  direction: "client" | "server";
  type: string;
  timestamp: string;
  elapsedMs: number;
  toolName?: string;
  callId?: string;
  textLength?: number;
};

export type StageWebRealtimeDebugSummary = {
  eventCount: number;
  clientEventCount: number;
  serverEventCount: number;
  audioEventCount: number;
  maxElapsedMs: number;
  clientEventTypes: string[];
  serverEventTypes: string[];
  toolNames: string[];
  textProofObserved: boolean;
  toolCallObserved: boolean;
  toolOutputReturned: boolean;
  rawPayloadStored: false;
};

export function readStageWebRealtimeDebugEvents(): StageWebRealtimeDebugEvent[] {
  return readStoredDebugEvents();
}

export function createStageWebRealtimeDebugSummary(
  events: StageWebRealtimeDebugEvent[]
): StageWebRealtimeDebugSummary | undefined {
  if (events.length === 0) {
    return undefined;
  }

  const clientEvents = events.filter((event) => event.direction === "client");
  const serverEvents = events.filter((event) => event.direction === "server");
  const toolNames = uniqueCompactStrings(events.map((event) => event.toolName));

  return {
    eventCount: events.length,
    clientEventCount: clientEvents.length,
    serverEventCount: serverEvents.length,
    audioEventCount: events.filter((event) => event.type.includes("audio")).length,
    maxElapsedMs: Math.max(...events.map((event) => event.elapsedMs)),
    clientEventTypes: uniqueCompactStrings(clientEvents.map((event) => event.type)),
    serverEventTypes: uniqueCompactStrings(serverEvents.map((event) => event.type)),
    toolNames,
    textProofObserved: serverEvents.some((event) => event.textLength !== undefined),
    toolCallObserved: serverEvents.some(
      (event) => event.type === "response.function_call_arguments.done"
    ),
    toolOutputReturned: clientEvents.some(
      (event) => event.type === "conversation.item.create" && Boolean(event.callId)
    ),
    rawPayloadStored: false
  };
}

export function createStageWebRealtimeTextProbeClientEvents(
  promptText: string,
  probeId = stableHash(`${promptText}:${Date.now().toString(36)}`)
): StageWebRealtimeTextProbeClientEvent[] {
  const expectedReply = "Blackstage live text proof received.";

  return [
    {
      type: "conversation.item.create",
      event_id: `stage_web_probe_item_${probeId}`,
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: promptText
          }
        ]
      }
    },
    {
      type: "response.create",
      event_id: `stage_web_probe_response_${probeId}`,
      response: {
        output_modalities: ["text"],
        instructions: `Reply with exactly this text and no extra words: ${expectedReply}`,
        max_output_tokens: 24
      }
    }
  ];
}

export function createStageWebRealtimeToolProbeClientEvents(
  promptText: string,
  probeId = stableHash(`${promptText}:${Date.now().toString(36)}`)
): StageWebRealtimeToolProbeClientEvent[] {
  return [
    {
      type: "conversation.item.create",
      event_id: `stage_web_tool_probe_item_${probeId}`,
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: promptText
          }
        ]
      }
    },
    {
      type: "response.create",
      event_id: `stage_web_tool_probe_response_${probeId}`,
      response: {
        output_modalities: ["text"],
        instructions:
          "Call the provided function exactly once to prepare an approval-gated Blackstage action. Do not answer with normal text.",
        tools: [
          {
            type: "function",
            name: STAGE_WEB_REALTIME_TOOL_PROBE_NAME,
            description:
              "Prepare an approval-gated Blackstage action packet without executing it.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                action: {
                  type: "string"
                },
                reason: {
                  type: "string"
                }
              },
              required: ["action", "reason"]
            }
          }
        ],
        tool_choice: {
          type: "function",
          name: STAGE_WEB_REALTIME_TOOL_PROBE_NAME
        },
        max_output_tokens: 96
      }
    }
  ];
}

export function createStageWebRealtimeToolResultClientEvents(
  input: StageWebRealtimeToolResultInput,
  resultId = stableHash(`${input.callId}:${JSON.stringify(input.output)}`)
): StageWebRealtimeToolResultClientEvent[] {
  return [
    {
      type: "conversation.item.create",
      event_id: `stage_web_tool_result_item_${resultId}`,
      item: {
        type: "function_call_output",
        call_id: input.callId,
        output: JSON.stringify(input.output)
      }
    },
    {
      type: "response.create",
      event_id: `stage_web_tool_result_response_${resultId}`,
      response: {
        output_modalities: ["text"],
        instructions:
          "Acknowledge the approved local Blackstage tool result in one calm sentence.",
        max_output_tokens: 48
      }
    }
  ];
}

function sendStageWebRealtimeTextProbe(
  channel: RTCDataChannel,
  promptText: string,
  debug: {
    enabled: boolean;
    startedAt: number;
  }
) {
  const clientEvents = createStageWebRealtimeTextProbeClientEvents(promptText);

  clientEvents.forEach((clientEvent) => {
    recordStageWebRealtimeDebugEvent("client", clientEvent, debug);
    channel.send(JSON.stringify(clientEvent));
  });
}

function sendStageWebRealtimeToolProbe(
  channel: RTCDataChannel,
  promptText: string,
  debug: {
    enabled: boolean;
    startedAt: number;
  }
) {
  const clientEvents = createStageWebRealtimeToolProbeClientEvents(promptText);

  clientEvents.forEach((clientEvent) => {
    recordStageWebRealtimeDebugEvent("client", clientEvent, debug);
    channel.send(JSON.stringify(clientEvent));
  });
}

function sendStageWebRealtimeToolResult(
  channel: RTCDataChannel,
  input: StageWebRealtimeToolResultInput,
  debug: {
    enabled: boolean;
    startedAt: number;
  }
) {
  const clientEvents = createStageWebRealtimeToolResultClientEvents(input);

  clientEvents.forEach((clientEvent) => {
    recordStageWebRealtimeDebugEvent("client", clientEvent, debug);
    channel.send(JSON.stringify(clientEvent));
  });
}

function realtimeDataChannelMessageEndsResponse(message: unknown): boolean {
  const payload = parseRealtimeDataChannelPayload(message);

  return isRecord(payload) && payload.type === "response.done";
}

function recordStageWebRealtimeDebugEvent(
  direction: StageWebRealtimeDebugEvent["direction"],
  payload: unknown,
  debug: {
    enabled: boolean;
    startedAt: number;
  }
) {
  if (!debug.enabled) {
    return;
  }

  const event = createStageWebRealtimeDebugEvent(direction, payload, debug.startedAt);

  if (!event) {
    return;
  }

  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeDebugEvents?: StageWebRealtimeDebugEvent[];
  };
  const events = [
    ...(runtimeConfig.__blackstageRealtimeDebugEvents ?? readStoredDebugEvents()),
    event
  ].slice(-120);

  runtimeConfig.__blackstageRealtimeDebugEvents = events;

  try {
    localStorage.setItem(STAGE_WEB_REALTIME_DEBUG_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Debug capture is best-effort and must never interrupt the live session.
  }
}

function createStageWebRealtimeDebugEvent(
  direction: StageWebRealtimeDebugEvent["direction"],
  payload: unknown,
  startedAt: number
): StageWebRealtimeDebugEvent | undefined {
  const parsedPayload = parseRealtimeDataChannelPayload(payload);

  if (!isRecord(parsedPayload) || typeof parsedPayload.type !== "string") {
    return undefined;
  }

  const timestamp = new Date().toISOString();
  const toolName =
    readStringField(parsedPayload, "name") ??
    readStringField(readRecordField(parsedPayload, "item") ?? {}, "name");
  const callId =
    readStringField(parsedPayload, "call_id") ??
    readStringField(parsedPayload, "callId") ??
    readStringField(readRecordField(parsedPayload, "item") ?? {}, "call_id");
  const text =
    readStringField(parsedPayload, "text") ??
    readStringField(parsedPayload, "transcript") ??
    readStringField(parsedPayload, "delta") ??
    readStringField(parsedPayload, "arguments");

  return {
    direction,
    type: sanitizeRealtimeEventType(parsedPayload.type),
    timestamp,
    elapsedMs: Math.max(0, Date.now() - startedAt),
    toolName: toolName ? sanitizeRealtimeEventType(toolName) : undefined,
    callId: callId ? sanitizeRealtimeEventType(callId) : undefined,
    textLength: text ? text.length : undefined
  };
}

function readStoredDebugEvents(): StageWebRealtimeDebugEvent[] {
  try {
    const rawEvents = localStorage.getItem(STAGE_WEB_REALTIME_DEBUG_STORAGE_KEY);
    const parsedEvents = rawEvents ? (JSON.parse(rawEvents) as unknown) : undefined;

    return Array.isArray(parsedEvents)
      ? parsedEvents.filter(isStageWebRealtimeDebugEvent)
      : [];
  } catch {
    return [];
  }
}

function isStageWebRealtimeDebugEvent(
  event: unknown
): event is StageWebRealtimeDebugEvent {
  return (
    isRecord(event) &&
    (event.direction === "client" || event.direction === "server") &&
    typeof event.type === "string" &&
    typeof event.timestamp === "string" &&
    typeof event.elapsedMs === "number"
  );
}

function uniqueCompactStrings(values: Array<string | undefined>, limit = 16): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort()
    .slice(0, limit);
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
