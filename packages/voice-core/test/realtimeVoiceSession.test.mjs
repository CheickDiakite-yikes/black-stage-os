import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createVoiceCaptureStartPlan,
  inspectVoiceCapturePreflight
} from "../dist/capture/voiceCapture.js";
import {
  createRealtimeVoiceBrokerPlan,
  inspectRealtimeVoiceBrokerReadiness
} from "../dist/realtime/realtimeVoiceBroker.js";
import {
  createRealtimeBrokerNetworkErrorReadiness,
  createRealtimeBrokerReadinessProbe,
  interpretRealtimeBrokerReadinessResponse
} from "../dist/realtime/realtimeVoiceBrokerClient.js";
import { handleRealtimeUnifiedWebrtcBrokerRoute } from "../dist/realtime/realtimeVoiceBrokerRoute.js";
import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
  OPENAI_API_KEY_ENV_VAR,
  createRealtimeUnifiedWebrtcBrokerRequest
} from "../dist/realtime/realtimeVoiceServerBroker.js";
import { parseRealtimeVoiceServerEvent } from "../dist/realtime/realtimeVoiceEvent.js";
import { mapRealtimeVoiceEventToStageEvents } from "../dist/realtime/realtimeVoiceStageMapper.js";
import {
  exchangeRealtimeWebrtcSdp,
  inspectRealtimeWebrtcClientExchangeBlockers
} from "../dist/realtime/realtimeVoiceWebrtcClient.js";
import {
  BLACKSTAGE_REALTIME_INSTRUCTIONS_VERSION,
  DEFAULT_REALTIME_VOICE_MODEL,
  createBlackstageRealtimeInstructionContract,
  createRealtimeVoiceSessionConfig,
  inspectRealtimeVoiceSessionSafety
} from "../dist/realtime/realtimeVoiceSession.js";

describe("Realtime voice session contracts", () => {
  it("preflights microphone capture without starting media or sending audio", () => {
    const preflight = inspectVoiceCapturePreflight({
      mediaDevicesAvailable: true,
      getUserMediaAvailable: true,
      permissionState: "prompt",
      explicitUserGesture: false,
      realtimeApprovalArmed: false
    });

    assert.equal(preflight.status, "needs_user_gesture");
    assert.equal(preflight.browserCanRequestMicrophone, false);
    assert.equal(preflight.startsMediaStream, false);
    assert.equal(preflight.browserSendsAudioToProvider, false);
    assert.equal(preflight.requiresUserGesture, true);
    assert.equal(preflight.requiresRealtimeApproval, true);
    assert.ok(
      preflight.warnings.some((warning) => warning.includes("explicit user gesture"))
    );
  });

  it("creates a microphone start plan only after gesture, approval, and permission", () => {
    const blocked = inspectVoiceCapturePreflight({
      mediaDevicesAvailable: true,
      getUserMediaAvailable: true,
      permissionState: "granted",
      explicitUserGesture: true,
      realtimeApprovalArmed: false
    });

    assert.equal(blocked.status, "needs_permission");
    assert.throws(() => createVoiceCaptureStartPlan(blocked), /not ready/);

    const ready = inspectVoiceCapturePreflight({
      mediaDevicesAvailable: true,
      getUserMediaAvailable: true,
      permissionState: "granted",
      explicitUserGesture: true,
      realtimeApprovalArmed: true
    });
    const plan = createVoiceCaptureStartPlan(ready);

    assert.equal(ready.status, "ready");
    assert.equal(ready.browserCanRequestMicrophone, true);
    assert.equal(plan.startsMediaStream, true);
    assert.equal(plan.browserSendsAudioToProvider, false);
    assert.equal(plan.handoff, "local_webrtc_track_only");
  });

  it("defaults to the verified realtime voice model in simulation mode", () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_1",
      threadId: "thread_build_blackstage"
    });

    assert.equal(config.model, DEFAULT_REALTIME_VOICE_MODEL);
    assert.equal(config.model, "gpt-realtime-2");
    assert.equal(config.networkMode, "simulation");
    assert.deepEqual(config.outputModalities, ["audio", "text"]);
  });

  it("creates a Blackstage-owned realtime instruction contract", () => {
    const contract = createBlackstageRealtimeInstructionContract();
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_instructions",
      threadId: "thread_build_blackstage"
    });

    assert.equal(contract.version, BLACKSTAGE_REALTIME_INSTRUCTIONS_VERSION);
    assert.equal(contract.model, "gpt-realtime-2");
    assert.equal(contract.speechCadence, "sparse_key_turns");
    assert.equal(contract.toolPolicy, "stage_approval_before_execution");
    assert.equal(contract.tracePolicy, "stage_events_only");
    assert.match(contract.instructions, /speak only key turns/i);
    assert.match(contract.instructions, /Do not execute tools/);
    assert.match(contract.instructions, /Stage approval event/);
    assert.equal(config.instructions, contract.instructions);
  });

  it("keeps browser safety boundaries explicit", () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_2",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live"
    });
    const report = inspectRealtimeVoiceSessionSafety(config);

    assert.equal(report.networkEnabled, true);
    assert.equal(report.safeForBrowser, true);
    assert.deepEqual(report.warnings, []);
    assert.equal(config.policy.requiresServerBroker, true);
    assert.equal(config.policy.forbidsBrowserApiKey, true);
    assert.equal(config.policy.toolCallsRequireStageApproval, true);
  });

  it("creates a server-mediated WebRTC broker plan for configured live voice", () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_live",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live"
    });
    const plan = createRealtimeVoiceBrokerPlan(config, {
      requestedAt: "2026-05-10T23:20:00.000Z",
      safetyIdentifier: "hashed-user-id"
    });

    assert.equal(plan.model, "gpt-realtime-2");
    assert.equal(plan.brokerMode, "server_unified_webrtc");
    assert.equal(plan.openAiEndpointPath, "/v1/realtime/calls");
    assert.equal(plan.standardApiKeyLocation, "server_environment_only");
    assert.equal(plan.exposesApiKeyToBrowser, false);
    assert.equal(plan.forwardsClientSdp, true);
    assert.equal(plan.dataChannelName, "oai-events");
    assert.equal(plan.stageEventPolicy.assistantSpeechEvent, "assistant.speech");
    assert.equal(plan.stageEventPolicy.toolCallsRequireApproval, true);
  });

  it("blocks live broker readiness without a safety identifier", () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_missing_safety",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live"
    });
    const readiness = inspectRealtimeVoiceBrokerReadiness(config);

    assert.equal(readiness.readyForLiveSession, false);
    assert.ok(
      readiness.warnings.some((warning) => warning.includes("safety identifier"))
    );
    assert.throws(
      () =>
        createRealtimeVoiceBrokerPlan(config, {
          requestedAt: "2026-05-10T23:20:00.000Z"
        }),
      /safety identifier/
    );
  });

  it("builds a browser readiness probe that sends no audio, SDP, or key material", () => {
    const probe = createRealtimeBrokerReadinessProbe(
      "http://127.0.0.1:8798/api/blackstage/realtime/session"
    );

    assert.equal(probe.method, "GET");
    assert.equal(probe.headers.accept, "application/json");
    assert.equal(probe.browserSendsAudio, false);
    assert.equal(probe.browserSendsSdp, false);
    assert.equal(probe.browserReceivesStandardApiKey, false);
  });

  it("interprets a mounted broker readiness response without treating live mode as connected", () => {
    const readiness = interpretRealtimeBrokerReadinessResponse({
      routeUrl: "http://127.0.0.1:8798/api/blackstage/realtime/session",
      status: 200,
      body: {
        ok: true,
        route: "/api/blackstage/realtime/session",
        liveModeEnabled: false,
        liveApprovalRequired: false,
        liveApprovalConfigured: false,
        accepts: "application/sdp",
        browserSendsAudio: false,
        browserReceivesStandardApiKey: false,
        checkedAt: "2026-05-10T00:00:00.000Z"
      },
      checkedAt: "2026-05-10T00:00:00.000Z"
    });

    assert.equal(readiness.status, "reachable");
    assert.equal(readiness.liveModeEnabled, false);
    assert.equal(readiness.liveApprovalRequired, false);
    assert.equal(readiness.liveApprovalConfigured, false);
    assert.equal(readiness.browserSendsAudio, false);
    assert.equal(readiness.browserSendsSdp, false);
    assert.equal(readiness.browserReceivesStandardApiKey, false);
  });

  it("keeps broker network errors explicit and credential-free", () => {
    const readiness = createRealtimeBrokerNetworkErrorReadiness(
      "http://127.0.0.1:8798/api/blackstage/realtime/session",
      new Error("connection refused"),
      "2026-05-10T00:00:00.000Z"
    );

    assert.equal(readiness.status, "unreachable");
    assert.equal(readiness.networkAttempted, true);
    assert.equal(readiness.browserSendsAudio, false);
    assert.equal(readiness.browserReceivesStandardApiKey, false);
    assert.deepEqual(readiness.errors, ["connection refused"]);
  });

  it("blocks browser WebRTC SDP exchange by default before peer or network work", async () => {
    const readiness = interpretRealtimeBrokerReadinessResponse({
      routeUrl: "http://127.0.0.1:8798/api/blackstage/realtime/session",
      status: 200,
      body: {
        ok: true,
        route: "/api/blackstage/realtime/session",
        liveModeEnabled: false,
        liveApprovalRequired: false,
        liveApprovalConfigured: false,
        accepts: "application/sdp",
        browserSendsAudio: false,
        browserReceivesStandardApiKey: false,
        checkedAt: "2026-05-10T00:00:00.000Z"
      }
    });
    let peerCalls = 0;
    let fetchCalls = 0;
    const exchange = await exchangeRealtimeWebrtcSdp({
      readiness,
      createPeerConnection: () => {
        peerCalls += 1;
        throw new Error("should not create peer");
      },
      fetchBrokerAnswer: async () => {
        fetchCalls += 1;
        throw new Error("should not fetch");
      }
    });

    assert.equal(exchange.status, "blocked");
    assert.equal(exchange.networkAttempted, false);
    assert.equal(exchange.peerConnectionCreated, false);
    assert.equal(exchange.browserSendsAudio, false);
    assert.equal(exchange.browserReceivesStandardApiKey, false);
    assert.equal(peerCalls, 0);
    assert.equal(fetchCalls, 0);
    assert.ok(exchange.errors.some((error) => error.includes("disabled by default")));
  });

  it("exchanges browser SDP through the broker with injected WebRTC and fetch adapters", async () => {
    const readiness = interpretRealtimeBrokerReadinessResponse({
      routeUrl: "http://127.0.0.1:8798/api/blackstage/realtime/session",
      status: 200,
      body: {
        ok: true,
        route: "/api/blackstage/realtime/session",
        liveModeEnabled: true,
        liveApprovalRequired: true,
        liveApprovalConfigured: true,
        accepts: "application/sdp",
        browserSendsAudio: false,
        browserReceivesStandardApiKey: false,
        checkedAt: "2026-05-10T00:00:00.000Z"
      }
    });
    const peerEvents = [];
    const exchange = await exchangeRealtimeWebrtcSdp({
      enabled: true,
      readiness,
      createPeerConnection: () => ({
        createDataChannel(label) {
          peerEvents.push(`data:${label}`);
          return {
            label
          };
        },
        async createOffer() {
          peerEvents.push("offer");
          return {
            type: "offer",
            sdp: "v=0\r\no=- blackstage-browser-offer\r\n"
          };
        },
        async setLocalDescription(description) {
          peerEvents.push(`local:${description.type}`);
        },
        async setRemoteDescription(description) {
          peerEvents.push(`remote:${description.type}`);
          assert.equal(description.sdp, "v=0\r\no=- blackstage-browser-answer\r\n");
        }
      }),
      fetchBrokerAnswer: async (request) => {
        assert.equal(
          request.routeUrl,
          "http://127.0.0.1:8798/api/blackstage/realtime/session"
        );
        assert.equal(request.headers["content-type"], "application/sdp");
        assert.equal(request.offerSdp, "v=0\r\no=- blackstage-browser-offer\r\n");

        return {
          status: 200,
          answerSdp: "v=0\r\no=- blackstage-browser-answer\r\n"
        };
      }
    });

    assert.equal(exchange.status, "connected");
    assert.equal(exchange.networkAttempted, true);
    assert.equal(exchange.peerConnectionCreated, true);
    assert.equal(exchange.dataChannelName, "oai-events");
    assert.equal(exchange.browserSendsAudio, false);
    assert.equal(exchange.browserReceivesStandardApiKey, false);
    assert.deepEqual(peerEvents, [
      "data:oai-events",
      "offer",
      "local:offer",
      "remote:answer"
    ]);
  });

  it("blocks WebRTC audio tracks without explicit Stage approval", async () => {
    const readiness = interpretRealtimeBrokerReadinessResponse({
      routeUrl: "http://127.0.0.1:8798/api/blackstage/realtime/session",
      status: 200,
      body: {
        ok: true,
        route: "/api/blackstage/realtime/session",
        liveModeEnabled: true,
        liveApprovalRequired: true,
        liveApprovalConfigured: true,
        accepts: "application/sdp",
        browserSendsAudio: false,
        browserReceivesStandardApiKey: false,
        checkedAt: "2026-05-10T00:00:00.000Z"
      }
    });
    let peerCalls = 0;
    let fetchCalls = 0;
    const exchange = await exchangeRealtimeWebrtcSdp({
      enabled: true,
      readiness,
      approvedAudioTrack: {
        kind: "audio",
        id: "local_microphone_track"
      },
      createPeerConnection: () => {
        peerCalls += 1;
        throw new Error("should not create peer before approval");
      },
      fetchBrokerAnswer: async () => {
        fetchCalls += 1;
        throw new Error("should not fetch before approval");
      }
    });

    assert.equal(exchange.status, "blocked");
    assert.equal(exchange.networkAttempted, false);
    assert.equal(exchange.peerConnectionCreated, false);
    assert.equal(exchange.browserSendsAudio, false);
    assert.equal(peerCalls, 0);
    assert.equal(fetchCalls, 0);
    assert.ok(
      exchange.errors.some((error) =>
        error.includes("requires explicit Stage approval")
      )
    );
  });

  it("attaches approved WebRTC audio tracks before creating an offer", async () => {
    const readiness = interpretRealtimeBrokerReadinessResponse({
      routeUrl: "http://127.0.0.1:8798/api/blackstage/realtime/session",
      status: 200,
      body: {
        ok: true,
        route: "/api/blackstage/realtime/session",
        liveModeEnabled: true,
        liveApprovalRequired: true,
        liveApprovalConfigured: true,
        accepts: "application/sdp",
        browserSendsAudio: false,
        browserReceivesStandardApiKey: false,
        checkedAt: "2026-05-10T00:00:00.000Z"
      }
    });
    const peerEvents = [];
    const exchange = await exchangeRealtimeWebrtcSdp({
      enabled: true,
      readiness,
      audioTrackApproved: true,
      approvedAudioTrack: {
        kind: "audio",
        enabled: true,
        id: "local_microphone_track"
      },
      createPeerConnection: () => ({
        addTrack(track) {
          peerEvents.push(`track:${track.kind}:${track.id}`);
        },
        createDataChannel(label) {
          peerEvents.push(`data:${label}`);
          return {
            label
          };
        },
        async createOffer() {
          peerEvents.push("offer");
          return {
            type: "offer",
            sdp: "v=0\r\no=- blackstage-browser-audio-offer\r\n"
          };
        },
        async setLocalDescription(description) {
          peerEvents.push(`local:${description.type}`);
        },
        async setRemoteDescription(description) {
          peerEvents.push(`remote:${description.type}`);
        }
      }),
      fetchBrokerAnswer: async (request) => {
        assert.equal(request.offerSdp, "v=0\r\no=- blackstage-browser-audio-offer\r\n");

        return {
          status: 200,
          answerSdp: "v=0\r\no=- blackstage-browser-audio-answer\r\n"
        };
      }
    });

    assert.equal(exchange.status, "connected");
    assert.equal(exchange.networkAttempted, true);
    assert.equal(exchange.peerConnectionCreated, true);
    assert.equal(exchange.browserSendsAudio, true);
    assert.equal(exchange.browserReceivesStandardApiKey, false);
    assert.deepEqual(peerEvents, [
      "track:audio:local_microphone_track",
      "data:oai-events",
      "offer",
      "local:offer",
      "remote:answer"
    ]);
  });

  it("requires a reachable broker before browser SDP exchange can start", () => {
    const blockers = inspectRealtimeWebrtcClientExchangeBlockers({
      enabled: true,
      readiness: createRealtimeBrokerNetworkErrorReadiness(
        "http://127.0.0.1:8798/api/blackstage/realtime/session",
        new Error("offline")
      )
    });

    assert.ok(blockers.some((error) => error.includes("must be reachable")));
  });

  it("keeps the unified WebRTC server broker disabled by default", () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_disabled",
      threadId: "thread_build_blackstage"
    });
    const request = createRealtimeUnifiedWebrtcBrokerRequest(config, {
      requestedAt: "2026-05-10T23:50:00.000Z"
    });

    assert.equal(request.enabled, false);
    assert.equal(request.clientContract.path, BLACKSTAGE_REALTIME_BROKER_ROUTE);
    assert.equal(request.clientContract.browserReceivesStandardApiKey, false);
    assert.equal(request.clientContract.browserReceivesSafetyIdentifier, false);
    assert.ok(
      request.blockedReasons.some((reason) => reason.includes("disabled by default"))
    );
    assert.ok(
      request.blockedReasons.some((reason) => reason.includes("simulation mode"))
    );
  });

  it("builds a trusted-server request envelope for live unified WebRTC", () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_live_request",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live",
      instructions:
        "Speak only key turns and route every tool call through Blackstage approvals."
    });
    const request = createRealtimeUnifiedWebrtcBrokerRequest(config, {
      requestedAt: "2026-05-10T23:51:00.000Z",
      clientSdpOffer: "v=0\r\no=- blackstage-test\r\n",
      liveModeEnabled: true,
      safetyIdentifier: "hashed-user-id",
      standardApiKeyAvailable: true
    });

    assert.equal(request.enabled, true);
    assert.equal(request.plan.model, "gpt-realtime-2");
    assert.equal(request.plan.openAiEndpointPath, "/v1/realtime/calls");
    assert.equal(request.openAiRequest.endpointPath, "/v1/realtime/calls");
    assert.equal(request.openAiRequest.authorization.envVar, OPENAI_API_KEY_ENV_VAR);
    assert.equal(request.openAiRequest.authorization.exposedToBrowser, false);
    assert.equal(request.openAiRequest.safetyIdentifier, "hashed-user-id");
    assert.equal(request.openAiRequest.body.kind, "multipart_form_data");
    assert.equal(request.openAiRequest.body.sdp, "v=0\r\no=- blackstage-test\r\n");
    assert.equal(request.openAiRequest.body.session.model, "gpt-realtime-2");
    assert.equal(request.openAiRequest.body.session.audio.output.voice, "marin");
    assert.equal(
      request.openAiRequest.body.session.metadata.blackstageThreadId,
      "thread_build_blackstage"
    );
    assert.equal(
      request.openAiRequest.body.session.metadata.blackstageInstructionsVersion,
      BLACKSTAGE_REALTIME_INSTRUCTIONS_VERSION
    );
    assert.equal(request.clientContract.browserReceives, "sdp_answer_only");
  });

  it("maps final realtime transcripts into voice intent submissions", () => {
    const [stageEvent] = mapRealtimeVoiceEventToStageEvents(
      {
        type: "voice.final_transcript",
        text: "Build the next investor plan.",
        timestamp: "2026-05-10T23:52:00.000Z"
      },
      {
        sessionId: "voice_session_mapper",
        threadId: "thread_build_blackstage"
      }
    );

    assert.equal(stageEvent?.type, "intent.submitted");
    assert.equal(stageEvent.payload.rawText, "Build the next investor plan.");
    assert.equal(stageEvent.payload.inputMode, "voice");
  });

  it("maps realtime assistant speech without storing partial deltas", () => {
    const partialEvents = mapRealtimeVoiceEventToStageEvents(
      {
        type: "voice.assistant_delta",
        textDelta: "Shaping",
        timestamp: "2026-05-10T23:53:00.000Z"
      },
      {
        sessionId: "voice_session_mapper",
        threadId: "thread_build_blackstage"
      }
    );
    const [speechEvent] = mapRealtimeVoiceEventToStageEvents(
      {
        type: "voice.assistant_speech",
        text: "Intent received. I am shaping the stage.",
        timestamp: "2026-05-10T23:53:01.000Z"
      },
      {
        sessionId: "voice_session_mapper",
        threadId: "thread_build_blackstage"
      }
    );

    assert.deepEqual(partialEvents, []);
    assert.equal(speechEvent?.type, "assistant.speech");
    assert.equal(speechEvent.payload.text, "Intent received. I am shaping the stage.");
  });

  it("maps realtime tool calls into Stage approval requests", () => {
    const [stageEvent] = mapRealtimeVoiceEventToStageEvents(
      {
        type: "voice.tool_call_requested",
        callId: "call_find_files",
        toolName: "find_files",
        requiresApproval: true,
        timestamp: "2026-05-10T23:54:00.000Z"
      },
      {
        sessionId: "voice_session_mapper",
        threadId: "thread_build_blackstage"
      }
    );

    assert.equal(stageEvent?.type, "approval.requested");
    assert.equal(stageEvent.payload.actionType, "tool_call");
    assert.equal(stageEvent.payload.status, "pending");
    assert.equal(stageEvent.payload.proposedBy, "Realtime voice broker");
  });

  it("maps realtime errors into failed agent events", () => {
    const [stageEvent] = mapRealtimeVoiceEventToStageEvents(
      {
        type: "voice.error",
        message: "Realtime connection closed before an answer SDP arrived.",
        timestamp: "2026-05-10T23:55:00.000Z"
      },
      {
        sessionId: "voice_session_mapper",
        threadId: "thread_build_blackstage"
      }
    );

    assert.equal(stageEvent?.type, "agent.progress");
    assert.equal(stageEvent.payload.type, "failed");
    assert.equal(
      stageEvent.payload.details,
      "Realtime connection closed before an answer SDP arrived."
    );
  });

  it("parses realtime server transcript events into voice events", () => {
    const finalTranscript = parseRealtimeVoiceServerEvent(
      {
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Build the next Blackstage proof object."
      },
      "2026-05-10T00:00:00.000Z"
    );
    const assistantSpeech = parseRealtimeVoiceServerEvent(
      {
        type: "response.output_audio_transcript.done",
        transcript: "I am shaping the stage."
      },
      "2026-05-10T00:00:01.000Z"
    );
    const contentPartSpeech = parseRealtimeVoiceServerEvent(
      {
        type: "response.content_part.done",
        part: {
          type: "audio",
          transcript: "The stage is ready."
        }
      },
      "2026-05-10T00:00:02.000Z"
    );

    assert.deepEqual(finalTranscript, {
      type: "voice.final_transcript",
      text: "Build the next Blackstage proof object.",
      timestamp: "2026-05-10T00:00:00.000Z"
    });
    assert.deepEqual(assistantSpeech, {
      type: "voice.assistant_speech",
      text: "I am shaping the stage.",
      timestamp: "2026-05-10T00:00:01.000Z"
    });
    assert.deepEqual(contentPartSpeech, {
      type: "voice.assistant_speech",
      text: "The stage is ready.",
      timestamp: "2026-05-10T00:00:02.000Z"
    });
  });

  it("parses realtime tool calls into approval-required voice events", () => {
    const event = parseRealtimeVoiceServerEvent(
      {
        type: "response.function_call_arguments.done",
        call_id: "call_realtime_browser",
        name: "open_browser"
      },
      "2026-05-10T00:00:00.000Z"
    );

    assert.deepEqual(event, {
      type: "voice.tool_call_requested",
      callId: "call_realtime_browser",
      toolName: "open_browser",
      requiresApproval: true,
      timestamp: "2026-05-10T00:00:00.000Z"
    });
  });

  it("rejects unsupported broker route methods before any network exchange", async () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_route",
      threadId: "thread_build_blackstage"
    });
    let exchangeCalls = 0;
    const response = await handleRealtimeUnifiedWebrtcBrokerRoute(
      {
        method: "GET",
        path: BLACKSTAGE_REALTIME_BROKER_ROUTE,
        headers: {
          "content-type": "application/sdp"
        },
        body: "v=0\r\n",
        requestedAt: "2026-05-10T23:56:00.000Z"
      },
      {
        config,
        exchangeWithOpenAi: async () => {
          exchangeCalls += 1;
          return {
            answerSdp: "should-not-run"
          };
        }
      }
    );

    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, "POST");
    assert.equal(response.networkAttempted, false);
    assert.equal(exchangeCalls, 0);
  });

  it("keeps the broker route disabled by default", async () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_route_disabled",
      threadId: "thread_build_blackstage"
    });
    const testRouteCredential = ["test", "route", "credential"].join("-");
    const response = await handleRealtimeUnifiedWebrtcBrokerRoute(
      {
        method: "POST",
        path: BLACKSTAGE_REALTIME_BROKER_ROUTE,
        headers: {
          "content-type": "application/sdp; charset=utf-8"
        },
        body: "v=0\r\n",
        requestedAt: "2026-05-10T23:57:00.000Z"
      },
      {
        config,
        environment: {
          openAiApiKey: testRouteCredential,
          safetyIdentifier: "hashed-user-id"
        }
      }
    );
    const body = JSON.parse(response.body);

    assert.equal(response.status, 503);
    assert.equal(response.networkAttempted, false);
    assert.ok(body.errors.some((error) => error.includes("disabled by default")));
    assert.doesNotMatch(response.body, new RegExp(testRouteCredential));
  });

  it("blocks live broker route requests without server safety and key material", async () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_route_missing_env",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live"
    });
    const response = await handleRealtimeUnifiedWebrtcBrokerRoute(
      {
        method: "POST",
        path: BLACKSTAGE_REALTIME_BROKER_ROUTE,
        headers: {
          "content-type": "application/sdp"
        },
        body: "v=0\r\n",
        requestedAt: "2026-05-10T23:58:00.000Z"
      },
      {
        config,
        environment: {
          liveModeEnabled: true
        }
      }
    );
    const body = JSON.parse(response.body);

    assert.equal(response.status, 503);
    assert.equal(response.networkAttempted, false);
    assert.ok(body.errors.some((error) => error.includes("safety identifier")));
    assert.ok(body.errors.some((error) => error.includes(OPENAI_API_KEY_ENV_VAR)));
  });

  it("exchanges SDP through an injected live broker handler only when enabled", async () => {
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_route_live",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live"
    });
    const testRouteCredential = ["test", "route", "credential"].join("-");
    let observedApiKey;
    const response = await handleRealtimeUnifiedWebrtcBrokerRoute(
      {
        method: "POST",
        path: BLACKSTAGE_REALTIME_BROKER_ROUTE,
        headers: {
          "Content-Type": "application/sdp"
        },
        body: "v=0\r\no=- blackstage-offer\r\n",
        requestedAt: "2026-05-10T23:59:00.000Z"
      },
      {
        config,
        environment: {
          liveModeEnabled: true,
          openAiApiKey: testRouteCredential,
          safetyIdentifier: "hashed-user-id"
        },
        exchangeWithOpenAi: async (openAiRequest, exchangeContext) => {
          observedApiKey = exchangeContext.apiKey;
          assert.equal(openAiRequest.body.sdp, "v=0\r\no=- blackstage-offer\r\n");
          assert.equal(openAiRequest.body.session.model, "gpt-realtime-2");
          assert.equal(openAiRequest.authorization.exposedToBrowser, false);

          return {
            answerSdp: "v=0\r\no=- blackstage-answer\r\n",
            responseHeaders: {
              authorization: "Bearer should-not-leak",
              "x-openai-request-id": "req_test"
            }
          };
        }
      }
    );

    assert.equal(observedApiKey, testRouteCredential);
    assert.equal(response.status, 200);
    assert.equal(response.networkAttempted, true);
    assert.equal(response.headers["content-type"], "application/sdp");
    assert.equal(response.headers["x-openai-request-id"], "req_test");
    assert.equal(response.headers.authorization, undefined);
    assert.equal(response.body, "v=0\r\no=- blackstage-answer\r\n");
    assert.doesNotMatch(
      JSON.stringify(response),
      new RegExp(`${testRouteCredential}|should-not-leak`)
    );
  });

  it("returns a safe broker route failure when the OpenAI exchange throws", async () => {
    const dummyApiKey = ["test", "api", "credential"].join("-");
    const config = createRealtimeVoiceSessionConfig({
      sessionId: "voice_session_route_live_failure",
      threadId: "thread_build_blackstage",
      networkMode: "configured_live"
    });
    const response = await handleRealtimeUnifiedWebrtcBrokerRoute(
      {
        method: "POST",
        path: BLACKSTAGE_REALTIME_BROKER_ROUTE,
        headers: {
          "content-type": "application/sdp"
        },
        body: "v=0\r\no=- blackstage-offer\r\n",
        requestedAt: "2026-05-11T00:01:00.000Z"
      },
      {
        config,
        environment: {
          liveModeEnabled: true,
          openAiApiKey: dummyApiKey,
          safetyIdentifier: "hashed-user-id"
        },
        exchangeWithOpenAi: async () => {
          throw new Error("provider failed with internal detail");
        }
      }
    );
    const body = JSON.parse(response.body);

    assert.equal(response.status, 503);
    assert.equal(response.networkAttempted, true);
    assert.equal(
      body.errors[0],
      "Realtime broker exchange failed before returning an SDP answer."
    );
    assert.doesNotMatch(response.body, /internal detail/);
  });
});
