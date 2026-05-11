import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createLiveVoiceTestEnvPlan,
  renderLiveVoiceTestEnvPlan
} from "../prepare-live-voice-test-env.mjs";

describe("live voice test env plan", () => {
  it("prints manual broker and Stage Web commands without exposing provider keys", () => {
    const plan = createLiveVoiceTestEnvPlan({
      repoRoot: "/tmp/black-stage-os",
      approvalToken: "approval-demo",
      safetyIdentifier: "blackstage-local-demo",
      openAiApiKeyStatus: "set"
    });
    const rendered = renderLiveVoiceTestEnvPlan(plan);

    assert.equal(plan.writesEnvFile, false);
    assert.equal(plan.printsOpenAiApiKey, false);
    assert.equal(plan.browserReceivesStandardApiKey, false);
    assert.equal(plan.startsProviderCallByItself, false);
    assert.equal(plan.startsMicrophoneByItself, false);
    assert.equal(plan.providerCallRequiresOrbClick, true);
    assert.equal(plan.providerCallRequiresStageApproval, true);
    assert.equal(plan.microphoneRequiresBrowserPermission, true);
    assert.match(rendered, /Terminal A: broker/);
    assert.match(rendered, /set -a/);
    assert.match(rendered, /export BLACKSTAGE_REALTIME_LIVE='1'/);
    assert.match(
      rendered,
      /export BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER='blackstage-local-demo'/
    );
    assert.match(
      rendered,
      /export BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN='approval-demo'/
    );
    assert.match(
      rendered,
      /VITE_BLACKSTAGE_REALTIME_BROKER_URL='http:\/\/127\.0\.0\.1:8798'/
    );
    assert.match(rendered, /VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED='1'/);
    assert.match(rendered, /VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED='0'/);
    assert.match(rendered, /VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED='1'/);
    assert.match(rendered, /VITE_BLACKSTAGE_REALTIME_TOOL_PROBE=/);
    assert.match(rendered, /click the center orb/);
    assert.equal(rendered.includes(["OPENAI_API_KEY", "="].join("")), false);
  });
});
