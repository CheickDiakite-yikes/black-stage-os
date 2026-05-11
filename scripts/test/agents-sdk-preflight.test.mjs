import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { URL, fileURLToPath } from "node:url";
import {
  AGENTS_SDK_LIVE_ENV_VAR,
  AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR,
  createAgentsSdkPreflight
} from "../preflight-agents-sdk.mjs";
import { OPENAI_API_KEY_ENV_VAR } from "../prepare-realtime-smoke-env.mjs";

const PREFLIGHT_AGENTS_SDK_SCRIPT_PATH = fileURLToPath(
  new URL("../preflight-agents-sdk.mjs", import.meta.url)
);

describe("Agents SDK preflight", () => {
  it("does not arm live Agents SDK work from .env.local alone", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-agents-preflight-"));
    const localApprovalPhrase = "local-agents-approval";
    const localProviderCredential = "sk-proj-agents123";

    try {
      await writeFile(
        join(repoRoot, ".env.local"),
        [
          envLine(AGENTS_SDK_LIVE_ENV_VAR, "1"),
          envLine(AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR, localApprovalPhrase),
          envLine(OPENAI_API_KEY_ENV_VAR, localProviderCredential)
        ].join("\n"),
        "utf8"
      );

      const result = spawnAgentsPreflight({
        cwd: repoRoot
      });
      const output = JSON.parse(result.stdout);

      assert.equal(result.status, 0);
      assert.equal(output.okToRun, false);
      assert.equal(output.agentsSdkLiveArmedByShell, false);
      assert.equal(output.approvalTokenSetByShell, false);
      assert.equal(output.localEnvIncludesLiveFlag, true);
      assert.equal(output.localEnvIncludesApprovalToken, true);
      assert.equal(output.runtimeEnv.OPENAI_API_KEY, "set");
      assert.equal(output.agentsSdkRunWouldStart, false);
      assert.equal(result.stdout.includes(localApprovalPhrase), false);
      assert.equal(result.stdout.includes(localProviderCredential), false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("fails preflight when shell arms live Agents SDK without provider key", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-agents-preflight-"));

    try {
      const result = spawnAgentsPreflight({
        cwd: repoRoot,
        env: {
          [AGENTS_SDK_LIVE_ENV_VAR]: "1",
          [AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR]: "shell-agents-approval"
        }
      });
      const output = JSON.parse(result.stdout);

      assert.equal(result.status, 1);
      assert.equal(output.okToRun, false);
      assert.equal(output.agentsSdkLiveArmedByShell, true);
      assert.equal(output.approvalTokenSetByShell, true);
      assert.deepEqual(output.missingRuntimeEnv, [OPENAI_API_KEY_ENV_VAR]);
      assert.equal(output.agentsSdkRunWouldStart, false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("arms preflight only when shell approval and provider key are available", () => {
    const shellApprovalPhrase = "shell-agents-approval";
    const shellProviderCredential = "sk-proj-shellagents";
    const result = spawnAgentsPreflight({
      env: {
        [AGENTS_SDK_LIVE_ENV_VAR]: "1",
        [AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR]: shellApprovalPhrase,
        [OPENAI_API_KEY_ENV_VAR]: shellProviderCredential
      }
    });
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 0);
    assert.equal(output.okToRun, true);
    assert.equal(output.agentsSdkMode, "live_ready");
    assert.equal(output.agentsSdkLiveArmedByShell, true);
    assert.equal(output.approvalTokenSetByShell, true);
    assert.equal(output.runtimeEnv.OPENAI_API_KEY, "set");
    assert.equal(output.agentsSdkRunWouldStart, true);
    assert.equal(output.browserCanRunAgents, false);
    assert.equal(output.browserReceivesProviderCredentials, false);
    assert.equal(result.stdout.includes(shellApprovalPhrase), false);
    assert.equal(result.stdout.includes(shellProviderCredential), false);
  });

  it("builds redacted dry-run metadata with memory and handoff boundaries", () => {
    const preflight = createAgentsSdkPreflight({
      env: {},
      localEnv: {
        loaded: false,
        envPath: ".env",
        loadedEnvVars: [],
        skippedEnvVars: []
      },
      shellAgentsSdkLiveEnabled: false,
      shellApprovalTokenSet: false
    });

    assert.equal(preflight.okToRun, false);
    assert.equal(preflight.agentsSdkMode, "dry_run");
    assert.equal(preflight.handoffsAllowed, false);
    assert.equal(preflight.memoryAccess.rawMemoryAccess, "forbidden");
    assert.equal(preflight.memoryAccess.writesRequireStageApproval, true);
    assert.equal(preflight.tracing.redaction, "stage_event_summaries_only");
    assert.equal(preflight.safetyGuard.providerPersistenceForbidden, true);
  });
});

function spawnAgentsPreflight({ cwd = process.cwd(), env = {} } = {}) {
  return spawnSync(process.execPath, [PREFLIGHT_AGENTS_SDK_SCRIPT_PATH], {
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
