import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  createRealtimeSmokeEnvPlan,
  createRealtimeSmokeSafetyIdentifier,
  renderRealtimeSmokeEnvPlan
} from "../prepare-realtime-smoke-env.mjs";
import {
  REALTIME_SMOKE_PROOF_KIND,
  createRealtimeLiveSmokeProof,
  createRequiredEnvStatus,
  createSafeRealtimeSmokeErrorMessage,
  resolveRealtimeSmokeProofPath,
  writeRealtimeLiveSmokeProof
} from "../realtime-live-smoke-proof.mjs";

describe("Realtime live smoke proof", () => {
  it("creates redacted proof metadata without browser credentials or audio", () => {
    const proof = createRealtimeLiveSmokeProof({
      status: "passed",
      createdAt: "2026-05-11T10:00:00.000Z",
      route: "/api/blackstage/realtime/session",
      liveSmokeArmed: true,
      requiredEnv: {
        OPENAI_API_KEY: "set",
        BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: "set",
        BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN: "set"
      },
      missingEnv: [],
      openAiNetworkCallAttempted: true,
      offerBytes: 1200,
      answerBytes: 2400,
      answerSha256Prefix: "abc123ef45ff",
      browserSendsAudio: false,
      errorMessage: "approval token super-secret-token and sk-proj-secretsecret",
      notes: ["safe evidence only"]
    });

    const rawProof = JSON.stringify(proof);

    assert.equal(proof.proofVersion, 1);
    assert.equal(proof.kind, REALTIME_SMOKE_PROOF_KIND);
    assert.equal(proof.status, "passed");
    assert.equal(proof.browserReceivesStandardApiKey, false);
    assert.equal(proof.browserSendsAudio, false);
    assert.equal(proof.openAiNetworkCallAttempted, true);
    assert.equal(proof.requiredEnv.OPENAI_API_KEY, "set");
    assert.equal(rawProof.includes("super-secret-token"), false);
    assert.equal(rawProof.includes("sk-proj-secretsecret"), false);
  });

  it("writes proof files only inside .blackstage", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-proof-"));

    try {
      const proof = createRealtimeLiveSmokeProof({
        status: "skipped",
        createdAt: "2026-05-11T10:00:00.000Z",
        liveSmokeArmed: false,
        requiredEnv: {
          OPENAI_API_KEY: "set"
        },
        missingEnv: ["BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN"],
        openAiNetworkCallAttempted: false,
        browserSendsAudio: false
      });

      const result = await writeRealtimeLiveSmokeProof(proof, {
        repoRoot,
        proofPath: ".blackstage/realtime-smoke/latest.json"
      });
      const written = JSON.parse(
        await readFile(join(repoRoot, ".blackstage/realtime-smoke/latest.json"), "utf8")
      );

      assert.equal(result.proofPath, ".blackstage/realtime-smoke/latest.json");
      assert.equal(written.status, "skipped");
      assert.throws(() =>
        resolveRealtimeSmokeProofPath("realtime-smoke/latest.json", repoRoot)
      );
      assert.throws(() => resolveRealtimeSmokeProofPath("../outside.json", repoRoot));
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("summarizes env readiness and omits raw SDP-looking errors", () => {
    assert.deepEqual(
      createRequiredEnvStatus(
        {
          OPENAI_API_KEY: "present",
          BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: ""
        },
        ["OPENAI_API_KEY", "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER"]
      ),
      {
        OPENAI_API_KEY: "set",
        BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: "unset"
      }
    );
    assert.equal(
      createSafeRealtimeSmokeErrorMessage(
        new Error("Live failed with body:\nv=0\na=fingerprint:sha-256 abc")
      ),
      "Live Realtime smoke failed with protocol output; raw SDP omitted."
    );
  });
});

describe("Realtime live smoke env plan", () => {
  it("creates stable safety identifiers without exposing the raw repo path", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-env-plan-"));

    try {
      const identifier = createRealtimeSmokeSafetyIdentifier(repoRoot);

      assert.match(identifier, /^blackstage-local-[a-f0-9]{20}$/);
      assert.equal(identifier.includes(repoRoot), false);
      assert.equal(identifier, createRealtimeSmokeSafetyIdentifier(repoRoot));
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("renders shell-only exports without provider credentials", () => {
    const plan = createRealtimeSmokeEnvPlan({
      repoRoot: "/tmp/blackstage",
      createdAt: "2026-05-11T10:00:00.000Z",
      approvalToken: "token-demo",
      safetyIdentifier: "blackstage-local-demo",
      openAiApiKeyStatus: "set"
    });
    const rendered = renderRealtimeSmokeEnvPlan(plan);

    assert.equal(plan.writesEnvFile, false);
    assert.equal(plan.browserReceivesStandardApiKey, false);
    assert.equal(plan.openAiNetworkCallWouldRunAfterExport, true);
    assert.match(rendered, /export BLACKSTAGE_REALTIME_LIVE_SMOKE='1'/);
    assert.match(
      rendered,
      /export BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER='blackstage-local-demo'/
    );
    assert.match(
      rendered,
      /export BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN='token-demo'/
    );
    assert.match(
      rendered,
      /export BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH='.blackstage\/realtime-smoke\/live-2026-05-11T10-00-00-000Z.json'/
    );
    assert.equal(rendered.includes("OPENAI_API_KEY="), false);
  });
});
