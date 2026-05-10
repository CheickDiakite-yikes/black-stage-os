import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRealtimeVoiceBrokerPlan,
  inspectRealtimeVoiceBrokerReadiness
} from "../dist/realtime/realtimeVoiceBroker.js";
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
});
