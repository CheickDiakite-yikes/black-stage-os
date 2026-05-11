import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRealtimeVoiceBrokerPlan,
  inspectRealtimeVoiceBrokerReadiness
} from "../dist/realtime/realtimeVoiceBroker.js";
import { handleRealtimeUnifiedWebrtcBrokerRoute } from "../dist/realtime/realtimeVoiceBrokerRoute.js";
import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
  OPENAI_API_KEY_ENV_VAR,
  createRealtimeUnifiedWebrtcBrokerRequest
} from "../dist/realtime/realtimeVoiceServerBroker.js";
import { mapRealtimeVoiceEventToStageEvents } from "../dist/realtime/realtimeVoiceStageMapper.js";
import {
  DEFAULT_REALTIME_VOICE_MODEL,
  createRealtimeVoiceSessionConfig,
  inspectRealtimeVoiceSessionSafety
} from "../dist/realtime/realtimeVoiceSession.js";

describe("Realtime voice session contracts", () => {
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
      instructions: "Speak only key turns and route every tool call through Blackstage approvals."
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
    assert.equal(request.openAiRequest.body.session.metadata.blackstageThreadId, "thread_build_blackstage");
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
    assert.equal(stageEvent.payload.details, "Realtime connection closed before an answer SDP arrived.");
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
    assert.doesNotMatch(JSON.stringify(response), new RegExp(`${testRouteCredential}|should-not-leak`));
  });
});
