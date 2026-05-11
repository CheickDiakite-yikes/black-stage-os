import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { URL, fileURLToPath } from "node:url";
import {
  CODEX_RUN_APPROVAL_TOKEN_ENV_VAR,
  CODEX_SUBPROCESS_ENV_VAR
} from "../preflight-codex-runner.mjs";
import {
  AGENTS_SDK_LIVE_ENV_VAR,
  AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR
} from "../preflight-agents-sdk.mjs";
import {
  LIVE_SMOKE_ENV_VAR,
  REALTIME_REQUIRED_ENV_VARS
} from "../preflight-realtime-live.mjs";
import { createLiveReadinessPreflight } from "../preflight-live-readiness.mjs";
import { OPENAI_API_KEY_ENV_VAR } from "../prepare-realtime-smoke-env.mjs";

const PREFLIGHT_LIVE_SCRIPT_PATH = fileURLToPath(
  new URL("../preflight-live-readiness.mjs", import.meta.url)
);
const REALTIME_SAFETY_IDENTIFIER_ENV_VAR = REALTIME_REQUIRED_ENV_VARS[1];
const REALTIME_APPROVAL_ENV_VAR = REALTIME_REQUIRED_ENV_VARS[2];

describe("Live readiness preflight", () => {
  it("does not arm aggregate live readiness from .env.local alone", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-live-preflight-"));
    const localProviderCredential = "sk-proj-live123";
    const localApprovalPhrase = "local-live-approval";

    try {
      await writeFile(
        join(repoRoot, ".env.local"),
        [
          envLine(OPENAI_API_KEY_ENV_VAR, localProviderCredential),
          envLine(LIVE_SMOKE_ENV_VAR, "1"),
          envLine(REALTIME_SAFETY_IDENTIFIER_ENV_VAR, "blackstage-local-test"),
          envLine(REALTIME_APPROVAL_ENV_VAR, localApprovalPhrase),
          envLine(CODEX_SUBPROCESS_ENV_VAR, "1"),
          envLine(CODEX_RUN_APPROVAL_TOKEN_ENV_VAR, localApprovalPhrase),
          envLine(AGENTS_SDK_LIVE_ENV_VAR, "1"),
          envLine(AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR, localApprovalPhrase)
        ].join("\n"),
        "utf8"
      );

      const result = spawnLivePreflight({
        cwd: repoRoot
      });
      const output = JSON.parse(result.stdout);

      assert.equal(result.status, 0);
      assert.equal(output.okToRun, false);
      assert.equal(output.anyLiveGateArmed, false);
      assert.equal(output.noExternalActionTaken, true);
      assert.equal(output.gates.realtime.localEnvIncludesLiveFlag, true);
      assert.equal(output.gates.codexRunner.localEnvIncludesCodexSubprocessFlag, true);
      assert.equal(output.gates.agentsSdk.localEnvIncludesLiveFlag, true);
      assert.equal(result.stdout.includes(localProviderCredential), false);
      assert.equal(result.stdout.includes(localApprovalPhrase), false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("fails when a shell-armed live gate is missing runtime requirements", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-live-preflight-"));

    try {
      const result = spawnLivePreflight({
        cwd: repoRoot,
        env: {
          [LIVE_SMOKE_ENV_VAR]: "1"
        }
      });
      const output = JSON.parse(result.stdout);

      assert.equal(result.status, 1);
      assert.equal(output.okToRun, false);
      assert.deepEqual(output.shellArmedButBlocked, ["realtime"]);
      assert.equal(output.gates.realtime.liveSmokeArmedByShell, true);
      assert.equal(output.gates.realtime.openAiNetworkCallWouldRun, false);
      assert.equal(output.noExternalActionTaken, true);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("summarizes all gates as ready only when shell/runtime requirements are set", () => {
    const providerCredential = "sk-proj-liveok";
    const approvalPhrase = "shell-live-approval";
    const preflight = createLiveReadinessPreflight({
      env: {
        [OPENAI_API_KEY_ENV_VAR]: providerCredential,
        [REALTIME_SAFETY_IDENTIFIER_ENV_VAR]: "blackstage-local-test",
        [REALTIME_APPROVAL_ENV_VAR]: approvalPhrase,
        [CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalPhrase,
        [AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalPhrase
      },
      localEnv: {
        loaded: false,
        envPath: ".env",
        loadedEnvVars: [],
        skippedEnvVars: []
      },
      shellState: {
        realtimeLiveSmokeArmed: true,
        codexSubprocessEnabled: true,
        codexApprovalTokenSet: true,
        agentsSdkLiveEnabled: true,
        agentsSdkApprovalTokenSet: true
      }
    });
    const rawPreflight = JSON.stringify(preflight);

    assert.equal(preflight.okToRun, true);
    assert.equal(preflight.allLiveGatesArmed, true);
    assert.equal(preflight.gates.realtime.openAiNetworkCallWouldRun, true);
    assert.equal(preflight.gates.codexRunner.codexSubprocessWouldRun, true);
    assert.equal(preflight.gates.agentsSdk.agentsSdkRunWouldStart, true);
    assert.equal(preflight.noExternalActionTaken, true);
    assert.equal(rawPreflight.includes(providerCredential), false);
    assert.equal(rawPreflight.includes(approvalPhrase), false);
  });
});

function spawnLivePreflight({ cwd = process.cwd(), env = {} } = {}) {
  return spawnSync(process.execPath, [PREFLIGHT_LIVE_SCRIPT_PATH], {
    cwd,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH ?? "",
      ...env
    }
  });
}

function envLine(envVar, value) {
  return `${envVar}=${value}`;
}
