import type { RealtimeBrokerClientReadiness } from "./realtimeVoiceBrokerClient.js";

export type RealtimeWebrtcClientExchangeStatus = "blocked" | "connected" | "failed";

export type RealtimeWebrtcSessionDescription = {
  type: "offer" | "answer";
  sdp: string;
};

export type RealtimeWebrtcDataChannel = {
  label: string;
};

export type RealtimeWebrtcAudioTrack = {
  kind: "audio";
  enabled?: boolean;
  id?: string;
};

export type RealtimeWebrtcPeerConnection = {
  addTrack?: (track: RealtimeWebrtcAudioTrack) => void;
  addTransceiver?: (
    kind: "audio",
    init: {
      direction: "recvonly";
    }
  ) => void;
  createDataChannel?: (label: "oai-events") => RealtimeWebrtcDataChannel;
  createOffer: () => Promise<RealtimeWebrtcSessionDescription>;
  setLocalDescription: (description: RealtimeWebrtcSessionDescription) => Promise<void>;
  setRemoteDescription: (
    description: RealtimeWebrtcSessionDescription
  ) => Promise<void>;
  close?: () => void;
};

export type RealtimeWebrtcPeerConnectionFactory = () => RealtimeWebrtcPeerConnection;

export type RealtimeWebrtcBrokerFetch = (request: {
  routeUrl: string;
  offerSdp: string;
  headers: {
    "content-type": "application/sdp";
  };
}) => Promise<{
  status: number;
  answerSdp: string;
}>;

export type RealtimeWebrtcClientExchangeInput = {
  enabled?: boolean;
  approvedAudioTrack?: RealtimeWebrtcAudioTrack;
  audioTrackApproved?: boolean;
  readiness: RealtimeBrokerClientReadiness;
  createPeerConnection: RealtimeWebrtcPeerConnectionFactory;
  fetchBrokerAnswer: RealtimeWebrtcBrokerFetch;
};

export type RealtimeWebrtcClientExchangeResult = {
  status: RealtimeWebrtcClientExchangeStatus;
  routeUrl?: string;
  networkAttempted: boolean;
  peerConnectionCreated: boolean;
  dataChannelName: "oai-events";
  browserSendsAudio: boolean;
  browserReceivesStandardApiKey: false;
  offerSdp?: string;
  answerSdp?: string;
  errors: string[];
};

export async function exchangeRealtimeWebrtcSdp(
  input: RealtimeWebrtcClientExchangeInput
): Promise<RealtimeWebrtcClientExchangeResult> {
  const blockedReasons = inspectRealtimeWebrtcClientExchangeBlockers(input);

  if (blockedReasons.length > 0) {
    return {
      status: "blocked",
      routeUrl: input.readiness.routeUrl,
      networkAttempted: false,
      peerConnectionCreated: false,
      dataChannelName: "oai-events",
      browserSendsAudio: false,
      browserReceivesStandardApiKey: false,
      errors: blockedReasons
    };
  }

  const routeUrl = input.readiness.routeUrl ?? "";
  const peerConnection = input.createPeerConnection();
  const browserSendsAudio = Boolean(input.approvedAudioTrack);

  if (input.approvedAudioTrack) {
    if (!peerConnection.addTrack) {
      peerConnection.close?.();

      return failedResult(
        routeUrl,
        false,
        "Browser WebRTC peer connection cannot attach an approved audio track."
      );
    }

    peerConnection.addTrack(input.approvedAudioTrack);
  } else {
    if (!peerConnection.addTransceiver) {
      peerConnection.close?.();

      return failedResult(
        routeUrl,
        false,
        "Browser WebRTC peer connection cannot create a recvonly audio section."
      );
    }

    peerConnection.addTransceiver("audio", {
      direction: "recvonly"
    });
  }

  peerConnection.createDataChannel?.("oai-events");

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    if (!offer.sdp.trim()) {
      peerConnection.close?.();
      return failedResult(routeUrl, false, "Browser WebRTC offer SDP was empty.");
    }

    const brokerResponse = await input.fetchBrokerAnswer({
      routeUrl,
      offerSdp: offer.sdp,
      headers: {
        "content-type": "application/sdp"
      }
    });

    if (brokerResponse.status !== 200 || !brokerResponse.answerSdp.trim()) {
      peerConnection.close?.();
      return failedResult(
        routeUrl,
        true,
        `Realtime broker SDP exchange returned HTTP ${brokerResponse.status}.`,
        offer.sdp
      );
    }

    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: brokerResponse.answerSdp
    });

    return {
      status: "connected",
      routeUrl,
      networkAttempted: true,
      peerConnectionCreated: true,
      dataChannelName: "oai-events",
      browserSendsAudio,
      browserReceivesStandardApiKey: false,
      offerSdp: offer.sdp,
      answerSdp: brokerResponse.answerSdp,
      errors: []
    };
  } catch (error) {
    peerConnection.close?.();
    return failedResult(
      routeUrl,
      false,
      error instanceof Error ? error.message : "Realtime WebRTC SDP exchange failed."
    );
  }
}

export function inspectRealtimeWebrtcClientExchangeBlockers(
  input: Pick<
    RealtimeWebrtcClientExchangeInput,
    "enabled" | "readiness" | "approvedAudioTrack" | "audioTrackApproved"
  >
): string[] {
  const blockedReasons: string[] = [];

  if (input.enabled !== true) {
    blockedReasons.push("Realtime WebRTC exchange is disabled by default.");
  }

  if (input.readiness.status !== "reachable") {
    blockedReasons.push("Realtime broker must be reachable before exchanging SDP.");
  }

  if (!input.readiness.routeUrl) {
    blockedReasons.push("Realtime broker route URL is not configured.");
  }

  if (input.approvedAudioTrack) {
    if (input.audioTrackApproved !== true) {
      blockedReasons.push(
        "Realtime audio track requires explicit Stage approval before SDP exchange."
      );
    }

    if (input.approvedAudioTrack.kind !== "audio") {
      blockedReasons.push("Realtime WebRTC track must be an audio track.");
    }
  }

  return blockedReasons;
}

function failedResult(
  routeUrl: string,
  networkAttempted: boolean,
  error: string,
  offerSdp?: string
): RealtimeWebrtcClientExchangeResult {
  return {
    status: "failed",
    routeUrl,
    networkAttempted,
    peerConnectionCreated: true,
    dataChannelName: "oai-events",
    browserSendsAudio: false,
    browserReceivesStandardApiKey: false,
    offerSdp,
    errors: [error]
  };
}
