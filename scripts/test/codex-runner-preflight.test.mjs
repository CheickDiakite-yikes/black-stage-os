import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { URL, fileURLToPath } from "node:url";
import {
  CODEX_RUN_APPROVAL_TOKEN_ENV_VAR,
  CODEX_SUBPROCESS_ENV_VAR,
  createCodexRunnerPreflight
} from "../preflight-codex-runner.mjs";

const PREFLIGHT_CODEX_RUNNER_SCRIPT_PATH = fileURLToPath(
  new URL("../preflight-codex-runner.mjs", import.meta.url)
);

describe("Codex runner preflight", () => {
  it("does not arm live Codex subprocess work from .env.local alone", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "blackstage-codex-preflight-"));
    const localApprovalPhrase = "local-codex-token";

    try {
      await writeFile(
        join(repoRoot, ".env.local"),
        [
          envLine(CODEX_SUBPROCESS_ENV_VAR, "1"),
          envLine(CODEX_RUN_APPROVAL_TOKEN_ENV_VAR, localApprovalPhrase)
        ].join("\n"),
        "utf8"
      );

      const result = spawnCodexPreflight({
        cwd: repoRoot
      });
      const output = JSON.parse(result.stdout);

      assert.equal(result.status, 0);
      assert.equal(output.okToRun, false);
      assert.equal(output.codexSubprocessArmedByShell, false);
      assert.equal(output.approvalTokenSetByShell, false);
      assert.equal(output.localEnvIncludesCodexSubprocessFlag, true);
      assert.equal(output.localEnvIncludesApprovalToken, true);
      assert.equal(output.codexSubprocessWouldRun, false);
      assert.equal(result.stdout.includes(localApprovalPhrase), false);
    } finally {
      await rm(repoRoot, {
        recursive: true,
        force: true
      });
    }
  });

  it("fails preflight when the shell arms live Codex without a shell token", () => {
    const result = spawnCodexPreflight({
      env: {
        [CODEX_SUBPROCESS_ENV_VAR]: "1"
      }
    });
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.equal(output.okToRun, false);
    assert.equal(output.codexSubprocessArmedByShell, true);
    assert.equal(output.approvalTokenSetByShell, false);
    assert.deepEqual(output.missingShellEnv, [CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]);
    assert.equal(output.codexSubprocessWouldRun, false);
  });

  it("arms preflight only when subprocess and approval token are shell-provided", () => {
    const shellApprovalPhrase = "shell-codex-token";
    const result = spawnCodexPreflight({
      env: {
        [CODEX_SUBPROCESS_ENV_VAR]: "1",
        [CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]: shellApprovalPhrase
      }
    });
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 0);
    assert.equal(output.okToRun, true);
    assert.equal(output.codexSubprocessArmedByShell, true);
    assert.equal(output.approvalTokenSetByShell, true);
    assert.equal(output.codexTransport, "cli");
    assert.equal(output.codexSubprocessWouldRun, true);
    assert.equal(output.browserCanRunCodex, false);
    assert.equal(result.stdout.includes(shellApprovalPhrase), false);
  });

  it("builds redacted dry-run metadata without browser execution rights", () => {
    const preflight = createCodexRunnerPreflight({
      env: {
        BLACKSTAGE_CODEX_TRANSPORT: "app_server"
      },
      localEnv: {
        loaded: false,
        envPath: ".env",
        loadedEnvVars: [],
        skippedEnvVars: []
      },
      shellCodexSubprocessEnabled: false,
      shellApprovalTokenSet: false
    });

    assert.equal(preflight.okToRun, false);
    assert.equal(preflight.codexTransport, "app_server");
    assert.equal(preflight.browserCanRunCodex, false);
    assert.equal(preflight.browserReceivesProviderCredentials, false);
    assert.equal(preflight.safetyGuard.localApprovalHeaderRequired, true);
  });
});

function spawnCodexPreflight({ cwd = process.cwd(), env = {} } = {}) {
  return spawnSync(process.execPath, [PREFLIGHT_CODEX_RUNNER_SCRIPT_PATH], {
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
