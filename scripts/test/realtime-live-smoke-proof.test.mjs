import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { URL, fileURLToPath } from "node:url";
import { loadLocalEnvFile } from "../local-env.mjs";
import {
  createRealtimeSmokeEnvPlan,
  createRealtimeSmokeSafetyIdentifier,
  renderRealtimeSmokeEnvPlan
} from "../prepare-realtime-smoke-env.mjs";
import {
  REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS,
  assertRealtimeLiveSmokeOfferIsCheap,
  createRealtimeLiveSmokeCheapGuard,
  readRealtimeLiveSmokeTimeoutMs
} from "../realtime-live-smoke-cheap-guard.mjs";
import {
  REALTIME_SMOKE_PROOF_KIND,
  createRealtimeLiveSmokeProof,
  createRequiredEnvStatus,
  createSafeRealtimeSmokeErrorMessage,
  resolveRealtimeSmokeProofPath,
  writeRealtimeLiveSmokeProof
} from "../realtime-live-smoke-proof.mjs";

const PREFLIGHT_SCRIPT_PATH = fileURLToPath(
  new URL("../preflight-realtime-live.mjs", import.meta.url)
);
const CHEAP_REALTIME_OFFER_SDP = [
  "v=0",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111",
  "a=recvonly",
  "m=application 9 UDP/DTLS/SCTP webrtc-datachannel"
].join("\r\n");

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
      cheapTestGuard: createRealtimeLiveSmokeCheapGuard({
        env: {},
        offerSdp: CHEAP_REALTIME_OFFER_SDP
      }),
      localEnv: {
        loaded: true,
        envPath: ".env",
        loadedEnvVars: ["OPENAI_API_KEY"],
        skippedEnvVars: []
      },
      debugSummary: {
        eventCount: 92,
        maxElapsedMs: 3037,
        clientEventTypes: ["conversation.item.create", "response.create"],
        serverEventTypes: [
          "response.output_text.done",
          "response.function_call_arguments.done",
          "invalid raw type with spaces"
        ],
        toolNames: ["blackstage_prepare_external_action"],
        textProofObserved: true,
        toolCallObserved: true,
        rawPayloadStored: false
      },
      errorMessage: "approval token super-secret-token and sk-proj-secretsecret",
      notes: ["safe evidence only"]
    });

    const rawProof = JSON.stringify(proof);

    assert.equal(proof.proofVersion, 1);
    assert.equal(proof.kind, REALTIME_SMOKE_PROOF_KIND);
    assert.equal(proof.status, "passed");
    assert.equal(proof.browserReceivesStandardApiKey, false);
    assert.equal(proof.browserSendsAudio, false);
    assert.equal(proof.cheapTestGuard.browserSendsAudio, false);
    assert.equal(proof.cheapTestGuard.browserReceivesStandardApiKey, false);
    assert.equal(proof.cheapTestGuard.offerMode, "data_channel_plus_recvonly_audio");
    assert.equal(proof.cheapTestGuard.requiresAudioMediaSection, true);
    assert.equal(proof.cheapTestGuard.rejectsBrowserAudioSend, true);
    assert.equal(proof.cheapTestGuard.maxProviderRequests, 1);
    assert.equal(proof.cheapTestGuard.timeoutCapMs, 15_000);
    assert.equal(proof.cheapTestGuard.offer.hasAudioMediaSection, true);
    assert.deepEqual(proof.cheapTestGuard.offer.audioDirections, ["recvonly"]);
    assert.equal(proof.cheapTestGuard.offer.hasAudioSendMediaSection, false);
    assert.equal(proof.cheapTestGuard.offer.hasDataChannelMediaSection, true);
    assert.equal(proof.openAiNetworkCallAttempted, true);
    assert.equal(proof.requiredEnv.OPENAI_API_KEY, "set");
    assert.deepEqual(proof.localEnv, {
      loaded: true,
      envPath: ".env",
      loadedEnvVars: ["OPENAI_API_KEY"],
      skippedEnvVars: []
    });
    assert.equal(proof.debugSummary.eventCount, 92);
    assert.deepEqual(proof.debugSummary.clientEventTypes, [
      "conversation.item.create",
      "response.create"
    ]);
    assert.deepEqual(proof.debugSummary.serverEventTypes, [
      "response.output_text.done",
      "response.function_call_arguments.done",
      "invalidrawtypewithspaces"
    ]);
    assert.deepEqual(proof.debugSummary.toolNames, [
      "blackstage_prepare_external_action"
    ]);
    assert.equal(proof.debugSummary.textProofObserved, true);
    assert.equal(proof.debugSummary.toolCallObserved, true);
    assert.equal(proof.debugSummary.rawPayloadStored, false);
    assert.equal(rawProof.includes("super-secret-token"), false);
    assert.equal(rawProof.includes("sk-proj-secretsecret"), false);
  });

  it("loads local .env values without returning secret values", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-local-env-"));
    const targetEnv = {};

    try {
      await writeFile(
        join(repoRoot, ".env"),
        [
          "OPENAI_API_KEY=sk-proj-fakekey123456",
          "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER='blackstage-local-test'",
          "IGNORED-WITH-DASH=value"
        ].join("\n"),
        "utf8"
      );

      const result = loadLocalEnvFile({
        repoRoot,
        targetEnv
      });
      const rawResult = JSON.stringify(result);

      assert.equal(result.loaded, true);
      assert.deepEqual(result.loadedEnvVars, [
        "OPENAI_API_KEY",
        "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER"
      ]);
      assert.equal(targetEnv.OPENAI_API_KEY, "sk-proj-fakekey123456");
      assert.equal(
        targetEnv.BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER,
        "blackstage-local-test"
      );
      assert.equal(rawResult.includes("sk-proj-fakekey123456"), false);
      assert.equal(rawResult.includes("blackstage-local-test"), false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("loads .env.local as the default local fallback", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-local-env-"));
    const targetEnv = {};

    try {
      await writeFile(
        join(repoRoot, ".env.local"),
        "OPENAI_API_KEY=sk-proj-fallback123\n",
        "utf8"
      );

      const result = loadLocalEnvFile({
        repoRoot,
        targetEnv
      });
      const rawResult = JSON.stringify(result);

      assert.equal(result.loaded, true);
      assert.equal(result.envPath, ".env.local");
      assert.deepEqual(result.loadedEnvVars, ["OPENAI_API_KEY"]);
      assert.equal(targetEnv.OPENAI_API_KEY, "sk-proj-fallback123");
      assert.equal(rawResult.includes("sk-proj-fallback123"), false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
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
    assert.match(
      createSafeRealtimeSmokeErrorMessage(
        new Error(
          'Live Realtime smoke failed with HTTP 503: {"errors":["Realtime broker exchange failed before returning an SDP answer.","OpenAI Realtime upstream returned HTTP 400.","OpenAI Realtime upstream error: type=invalid_request_error · code=invalid_request · message=Unsupported field: session.reasoning with sk-proj-redactme12345."]}'
        )
      ),
      /Unsupported field: session\.reasoning with \[redacted\]/
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
      openAiApiKeyStatus: "set",
      env: {}
    });
    const rendered = renderRealtimeSmokeEnvPlan(plan);

    assert.equal(plan.writesEnvFile, false);
    assert.equal(plan.browserReceivesStandardApiKey, false);
    assert.equal(plan.openAiNetworkCallWouldRunAfterExport, true);
    assert.deepEqual(plan.cheapTestGuard, {
      browserSendsAudio: false,
      browserReceivesStandardApiKey: false,
      liveFlagMustBeShellExport: true,
      liveCallRequiresExplicitArm: true,
      offerMode: "data_channel_plus_recvonly_audio",
      requiresAudioMediaSection: true,
      rejectsBrowserAudioSend: true,
      maxProviderRequests: 1,
      timeoutCapMs: 15_000,
      effectiveTimeoutMs: 15_000
    });
    assert.match(rendered, /Cheap guard: SDP-only/);
    assert.match(rendered, /Safety guard: local env files/);
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
    assert.match(rendered, /export BLACKSTAGE_REALTIME_LIVE_SMOKE_TIMEOUT_MS='15000'/);
    assert.equal(rendered.includes(["OPENAI_API_KEY", "="].join("")), false);
  });
});

describe("Realtime live smoke cheap guard", () => {
  it("caps runner timeout requests to the cheap smoke limit", () => {
    assert.equal(
      readRealtimeLiveSmokeTimeoutMs({
        BLACKSTAGE_REALTIME_LIVE_SMOKE_TIMEOUT_MS: "90000"
      }),
      REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS
    );
    assert.equal(
      readRealtimeLiveSmokeTimeoutMs({
        BLACKSTAGE_REALTIME_LIVE_SMOKE_TIMEOUT_MS: "5000"
      }),
      5_000
    );
    assert.equal(
      readRealtimeLiveSmokeTimeoutMs({}),
      REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS
    );
  });

  it("accepts recvonly-audio plus data-channel SDP offers", () => {
    const summary = assertRealtimeLiveSmokeOfferIsCheap(CHEAP_REALTIME_OFFER_SDP);

    assert.equal(summary.hasAudioMediaSection, true);
    assert.deepEqual(summary.audioDirections, ["recvonly"]);
    assert.equal(summary.hasAudioSendMediaSection, false);
    assert.equal(summary.hasDataChannelMediaSection, true);
    assert.equal(summary.hasVideoMediaSection, false);
  });

  it("rejects browser-audio-send or non-data-channel SDP before provider exchange", () => {
    assert.throws(() =>
      assertRealtimeLiveSmokeOfferIsCheap(
        [
          "v=0",
          "m=audio 9 UDP/TLS/RTP/SAVPF 111",
          "a=sendrecv",
          "m=application 9 UDP/DTLS/SCTP webrtc-datachannel"
        ].join("\r\n")
      )
    );
    assert.throws(() =>
      assertRealtimeLiveSmokeOfferIsCheap(
        "v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n"
      )
    );
    assert.throws(() =>
      assertRealtimeLiveSmokeOfferIsCheap("v=0\r\no=- blackstage-empty\r\n")
    );
  });
});

describe("Realtime live smoke arming", () => {
  it("does not arm a paid call from .env.local alone", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-preflight-"));

    try {
      await writeFile(
        join(repoRoot, ".env.local"),
        [
          "OPENAI_API_KEY=sk-proj-preflight123",
          "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER=blackstage-local-test",
          "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN=approval-token-test",
          "BLACKSTAGE_REALTIME_LIVE_SMOKE=1"
        ].join("\n"),
        "utf8"
      );

      const result = spawnSync(process.execPath, [PREFLIGHT_SCRIPT_PATH], {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          PATH: process.env.PATH ?? ""
        }
      });
      const output = JSON.parse(result.stdout);

      assert.equal(result.status, 0);
      assert.equal(output.okToRun, false);
      assert.equal(output.liveSmokeArmedByShell, false);
      assert.equal(output.localEnvIncludesLiveFlag, true);
      assert.equal(output.openAiNetworkCallWouldRun, false);
      assert.equal(output.requiredEnv.OPENAI_API_KEY, "set");
      assert.equal(result.stdout.includes("sk-proj-preflight123"), false);
      assert.equal(result.stdout.includes("approval-token-test"), false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });
});
