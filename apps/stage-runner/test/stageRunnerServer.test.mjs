/* global fetch */

import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { createDryRunCodexWorkerAdapter } from "../../../packages/agent-runtime/dist/harness/codexWorkerAdapter.js";
import { InMemoryHarnessScheduler } from "../../../packages/agent-runtime/dist/harness/inMemoryHarnessScheduler.js";
import {
  BLACKSTAGE_HARNESS_RUNNER_ROUTE,
  STAGE_RUNNER_CODEX_APPROVAL_HEADER,
  STAGE_RUNNER_CODEX_RUN_APPROVAL_TOKEN_ENV_VAR,
  STAGE_RUNNER_CODEX_SUBPROCESS_ENV_VAR,
  createCodexSubprocessPreview,
  createNodeCodexCommandExecutor,
  createStageRunnerRuntimeConfig,
  createStageRunnerServer
} from "../dist/index.js";

const servers = [];
const tempDirs = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
  await Promise.all(
    tempDirs.splice(0).map((directory) =>
      rm(directory, {
        force: true,
        recursive: true
      })
    )
  );
});

describe("Stage runner server", () => {
  it("exposes safe harness readiness without browser-side execution rights", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          origin: "http://127.0.0.1:4187"
        }
      }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://127.0.0.1:4187"
    );
    assert.equal(body.ok, true);
    assert.equal(body.route, BLACKSTAGE_HARNESS_RUNNER_ROUTE);
    assert.equal(body.orchestration, "symphony_style_internal_queue");
    assert.equal(body.codexMode, "dry_run");
    assert.equal(body.agentsSdkMode, "dry_run");
    assert.equal(body.workflowPolicy.source, "WORKFLOW.md");
    assert.equal(body.workflowPolicy.controlPlane, "symphony_style_internal_queue");
    assert.equal(body.workflowPolicy.codingWorker, "openai_codex_cli");
    assert.equal(body.workflowPolicy.agentWorker, "openai_agents_sdk_manager");
    assert.equal(body.workflowPolicy.voiceModel, "gpt-realtime-2");
    assert.equal(body.workflowPolicy.browserMutationAllowed, false);
    assert.equal(body.localCodexSubprocessEnabled, false);
    assert.equal(body.browserCanEnqueueWork, false);
    assert.equal(body.browserCanRunCodex, false);
    assert.equal(body.browserReceivesProviderCredentials, false);
  });

  it("labels the Codex subprocess boundary only when explicitly enabled", async () => {
    const runtimeConfig = createStageRunnerRuntimeConfig({
      [STAGE_RUNNER_CODEX_SUBPROCESS_ENV_VAR]: "1"
    });
    const server = await listen(
      createStageRunnerServer({
        runtimeConfig
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.codexMode, "local_exec");
    assert.equal(body.workflowPolicy.liveExecutionDefault, "disabled");
    assert.equal(body.workflowPolicy.humanApprovalRequiredForHighImpactActions, true);
    assert.equal(body.localCodexSubprocessEnabled, true);
    assert.equal(body.browserCanRunCodex, false);
    assert.equal(body.browserReceivesProviderCredentials, false);
  });

  it("requires a local approval token before live Codex run-next can schedule work", async () => {
    const repoRoot = await createTempRepoRoot();
    const runtimeConfig = createStageRunnerRuntimeConfig({
      [STAGE_RUNNER_CODEX_SUBPROCESS_ENV_VAR]: "1"
    });
    const server = await listen(
      createStageRunnerServer({
        runtimeConfig: {
          ...runtimeConfig,
          repoRoot
        }
      })
    );

    await enqueueCodexTask(server, "task_live_codex_requires_token");

    const runResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`,
      {
        method: "POST"
      }
    );
    const runBody = await runResponse.json();
    const snapshotResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/snapshot`
    );
    const snapshotBody = await snapshotResponse.json();

    assert.equal(runResponse.status, 403);
    assert.equal(runBody.ok, false);
    assert.match(runBody.errors[0], /matching local approval token/);
    assert.equal(snapshotBody.controlPlane.openWorkCount, 1);
    assert.equal(snapshotBody.snapshot.tasks[0].status, "queued");
  });

  it("accepts live Codex run-next only with a matching local approval token", async () => {
    const repoRoot = await createTempRepoRoot();
    const approvalPhrase = "approve-local-codex";
    const runtimeConfig = createStageRunnerRuntimeConfig({
      [STAGE_RUNNER_CODEX_SUBPROCESS_ENV_VAR]: "1",
      [STAGE_RUNNER_CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalPhrase
    });
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [createDryRunCodexWorkerAdapter()],
      now: () => "2026-05-10T00:00:00.000Z"
    });
    const server = await listen(
      createStageRunnerServer({
        runtimeConfig: {
          ...runtimeConfig,
          repoRoot
        },
        scheduler
      })
    );

    await enqueueCodexTask(server, "task_live_codex_matching_token");

    const blockedResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`,
      {
        method: "POST",
        headers: {
          [STAGE_RUNNER_CODEX_APPROVAL_HEADER]: "wrong-token"
        }
      }
    );
    const blockedBody = await blockedResponse.json();

    assert.equal(blockedResponse.status, 403);
    assert.equal(blockedBody.ok, false);

    const runResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`,
      {
        method: "POST",
        headers: {
          [STAGE_RUNNER_CODEX_APPROVAL_HEADER]: approvalPhrase
        }
      }
    );
    const runBody = await runResponse.json();

    assert.equal(runResponse.status, 200);
    assert.equal(runBody.run.status, "completed");
    assert.equal(runBody.run.adapterId, "codex_worker_adapter_dry_run");
    assert.equal(runBody.controlPlane.reviewCount, 1);
  });

  it("answers local readiness preflight without allowing browser mutations", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}`,
      {
        method: "OPTIONS",
        headers: {
          origin: "http://127.0.0.1:4187",
          "access-control-request-method": "GET"
        }
      }
    );

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://127.0.0.1:4187"
    );
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /GET/);
    assert.doesNotMatch(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/
    );
  });

  it("returns a Symphony-style empty snapshot before local work is enqueued", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/snapshot`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.deepEqual(body.snapshot.tasks, []);
    assert.equal(body.controlPlane.kind, "blackstage_internal_queue");
    assert.equal(body.controlPlane.workflowPolicy.source, "WORKFLOW.md");
    assert.equal(body.controlPlane.workflowPolicy.proofPacketRequired, true);
    assert.equal(body.controlPlane.openWorkCount, 0);
  });

  it("enqueues and dry-runs approved Codex tasks through the local service", async () => {
    const server = await listen(createStageRunnerServer());
    const taskResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          id: "task_stage_runner_codex",
          threadId: "thread_build_blackstage",
          title: "Prepare Codex worker packet",
          objective: "Prepare a dry-run Codex packet for human review.",
          kind: "codex",
          workspace: {
            kind: "local",
            path: ".blackstage/workspaces/task_stage_runner_codex"
          }
        })
      }
    );
    const taskBody = await taskResponse.json();

    assert.equal(taskResponse.status, 202);
    assert.equal(taskBody.task.status, "queued");

    const runResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`,
      {
        method: "POST"
      }
    );
    const runBody = await runResponse.json();

    assert.equal(runResponse.status, 200);
    assert.equal(runBody.run.status, "completed");
    assert.equal(runBody.run.adapterId, "codex_worker_adapter_dry_run");
    assert.equal(runBody.controlPlane.reviewCount, 1);
    assert.ok(
      runBody.snapshot.events.some(
        (event) =>
          event.type === "task.progress" &&
          event.payload?.provider === "openai_codex" &&
          event.payload?.execution_mode === "dry_run"
      )
    );
  });

  it("blocks approval-required tasks before any dry-run worker executes", async () => {
    const server = await listen(createStageRunnerServer());

    await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "task_approval_gate",
        threadId: "thread_build_blackstage",
        title: "Push branch",
        objective: "External action should wait for human approval.",
        kind: "codex",
        approvalRequired: true,
        workspace: {
          kind: "local",
          path: ".blackstage/workspaces/task_approval_gate"
        }
      })
    });
    const runResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`,
      {
        method: "POST"
      }
    );
    const runBody = await runResponse.json();

    assert.equal(runResponse.status, 200);
    assert.equal(runBody.run, null);
    assert.equal(runBody.controlPlane.blockedCount, 1);
    assert.ok(
      runBody.snapshot.events.some((event) => event.type === "approval.required")
    );
  });

  it("rejects browser-origin mutations even when the origin is local", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:4187"
        },
        body: JSON.stringify({
          threadId: "thread_build_blackstage",
          title: "Browser enqueue attempt",
          objective: "Should be blocked.",
          kind: "agent"
        })
      }
    );
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.ok, false);
    assert.match(body.errors[0], /Browser-origin/);
  });

  it("rejects malformed task inputs", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          title: "Missing fields"
        })
      }
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.match(body.errors[0], /requires threadId/);
  });

  it("prepares approved Codex task workspaces with manifest and run proof when enabled", async () => {
    const repoRoot = await createTempRepoRoot();
    const server = await listen(
      createStageRunnerServer({
        runtimeConfig: {
          repoRoot,
          workspacePreparationEnabled: true
        }
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          id: "task_prepare_workspace",
          threadId: "thread_build_blackstage",
          title: "Prepare workspace",
          objective: "Create the bounded Codex workspace manifest.",
          kind: "codex"
        })
      }
    );
    const body = await response.json();
    const manifestPath = join(
      repoRoot,
      ".blackstage/workspaces/task_prepare_workspace/blackstage-task.json"
    );
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    assert.equal(response.status, 202);
    assert.equal(
      body.task.workspace.path,
      ".blackstage/workspaces/task_prepare_workspace"
    );
    assert.equal(
      body.workspacePreparation.manifestPath,
      ".blackstage/workspaces/task_prepare_workspace/blackstage-task.json"
    );
    assert.equal(manifest.taskId, "task_prepare_workspace");
    assert.equal(manifest.policy.browserMutationAllowed, false);
    assert.equal(manifest.policy.humanReviewRequired, true);
    assert.equal(manifest.validationStatus, "pending");

    const runResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`,
      {
        method: "POST"
      }
    );
    const runBody = await runResponse.json();
    const proofPath = join(
      repoRoot,
      ".blackstage/workspaces/task_prepare_workspace/blackstage-run.json"
    );
    const proof = JSON.parse(await readFile(proofPath, "utf8"));

    assert.equal(runResponse.status, 200);
    assert.equal(runBody.run.status, "completed");
    assert.equal(
      runBody.runProof.proofPath,
      ".blackstage/workspaces/task_prepare_workspace/blackstage-run.json"
    );
    assert.equal(proof.taskId, "task_prepare_workspace");
    assert.equal(proof.status, "completed");
    assert.equal(proof.policy.externalActionTaken, false);
    assert.equal(proof.policy.humanReviewRequired, true);
    assert.ok(proof.eventCount >= 3);

    const proofsResponse = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/proofs`
    );
    const proofsBody = await proofsResponse.json();

    assert.equal(proofsResponse.status, 200);
    assert.equal(proofsBody.ok, true);
    assert.equal(proofsBody.proofs.length, 1);
    assert.equal(proofsBody.proofs[0].taskId, "task_prepare_workspace");
    assert.equal(proofsBody.proofs[0].status, "completed");
    assert.equal(
      proofsBody.proofs[0].proofPath,
      ".blackstage/workspaces/task_prepare_workspace/blackstage-run.json"
    );
  });

  it("rejects workspace preparation outside the approved Blackstage boundary", async () => {
    const repoRoot = await createTempRepoRoot();
    const server = await listen(
      createStageRunnerServer({
        runtimeConfig: {
          repoRoot,
          workspacePreparationEnabled: true
        }
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          id: "task_escape_workspace",
          threadId: "thread_build_blackstage",
          title: "Escape workspace",
          objective: "Should be rejected.",
          kind: "codex",
          workspace: {
            kind: "local",
            path: "../outside"
          }
        })
      }
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.match(body.errors[0], /workspace must stay inside/);
  });
});

describe("Node Codex command executor", () => {
  it("spawns Codex without a shell and writes the worker prompt to stdin", async () => {
    let spawned;
    const child = createFakeChildProcess();
    const executor = createNodeCodexCommandExecutor({
      timeoutMs: 1_000,
      spawnImpl: (command, args, options) => {
        spawned = {
          command,
          args,
          options
        };

        return child;
      }
    });
    const result = await executor({
      command: "codex",
      args: ["exec", "--json", "-"],
      cwd: ".blackstage/workspaces/task_codex",
      stdin: "Task: prove the subprocess boundary",
      env: {
        BLACKSTAGE_HARNESS_TASK_ID: "task_codex"
      }
    });
    const preview = createCodexSubprocessPreview({
      command: "codex",
      args: ["exec", "--json", "-"],
      cwd: ".blackstage/workspaces/task_codex",
      stdin: "Task: prove the subprocess boundary",
      env: {
        BLACKSTAGE_HARNESS_TASK_ID: "task_codex"
      }
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, "codex proof packet");
    assert.equal(spawned.command, "codex");
    assert.deepEqual(spawned.args, ["exec", "--json", "-"]);
    assert.equal(spawned.options.cwd, ".blackstage/workspaces/task_codex");
    assert.equal(spawned.options.shell, false);
    assert.equal(child.stdinText, "Task: prove the subprocess boundary");
    assert.equal(preview.stdinBytes, 35);
    assert.deepEqual(preview.envKeys, ["BLACKSTAGE_HARNESS_TASK_ID"]);
  });
});

async function listen(server) {
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  servers.push(server);

  return server;
}

function baseUrl(server) {
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected local TCP test server.");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function enqueueCodexTask(server, taskId) {
  const response = await fetch(
    `${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: taskId,
        threadId: "thread_build_blackstage",
        title: "Run live Codex boundary",
        objective: "Prove the local live Codex execution gate.",
        kind: "codex"
      })
    }
  );

  assert.equal(response.status, 202);
}

async function createTempRepoRoot() {
  const directory = await mkdtemp(join(tmpdir(), "blackstage-runner-"));

  tempDirs.push(directory);

  return directory;
}

function createFakeChildProcess() {
  const child = new EventEmitter();

  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdinText = "";
  child.stdin = {
    write(chunk) {
      child.stdinText += String(chunk);
    },
    end() {
      Promise.resolve().then(() => {
        child.stdout.emit("data", "codex proof packet");
        child.emit("close", 0);
      });
    }
  };
  child.kill = () => {
    child.killed = true;
  };

  return child;
}
