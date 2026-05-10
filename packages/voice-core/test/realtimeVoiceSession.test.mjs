import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
});
