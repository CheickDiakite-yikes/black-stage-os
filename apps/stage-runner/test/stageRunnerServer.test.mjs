/* global fetch */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  BLACKSTAGE_HARNESS_RUNNER_ROUTE,
  createStageRunnerServer
} from "../dist/index.js";

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe("Stage runner server", () => {
  it("exposes safe harness readiness without browser-side execution rights", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        origin: "http://127.0.0.1:4187"
      }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:4187");
    assert.equal(body.ok, true);
    assert.equal(body.route, BLACKSTAGE_HARNESS_RUNNER_ROUTE);
    assert.equal(body.orchestration, "symphony_style_internal_queue");
    assert.equal(body.codexMode, "dry_run");
    assert.equal(body.agentsSdkMode, "dry_run");
    assert.equal(body.localCodexSubprocessEnabled, false);
    assert.equal(body.browserCanEnqueueWork, false);
    assert.equal(body.browserCanRunCodex, false);
    assert.equal(body.browserReceivesProviderCredentials, false);
  });

  it("answers local readiness preflight without allowing browser mutations", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}`, {
      method: "OPTIONS",
      headers: {
        origin: "http://127.0.0.1:4187",
        "access-control-request-method": "GET"
      }
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:4187");
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /GET/);
    assert.doesNotMatch(response.headers.get("access-control-allow-methods") ?? "", /POST/);
  });

  it("returns a Symphony-style empty snapshot before local work is enqueued", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/snapshot`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.deepEqual(body.snapshot.tasks, []);
    assert.equal(body.controlPlane.kind, "blackstage_internal_queue");
    assert.equal(body.controlPlane.openWorkCount, 0);
  });

  it("enqueues and dry-runs approved Codex tasks through the local service", async () => {
    const server = await listen(createStageRunnerServer());
    const taskResponse = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`, {
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
    });
    const taskBody = await taskResponse.json();

    assert.equal(taskResponse.status, 202);
    assert.equal(taskBody.task.status, "queued");

    const runResponse = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`, {
      method: "POST"
    });
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
    const runResponse = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/run-next`, {
      method: "POST"
    });
    const runBody = await runResponse.json();

    assert.equal(runResponse.status, 200);
    assert.equal(runBody.run, null);
    assert.equal(runBody.controlPlane.blockedCount, 1);
    assert.ok(runBody.snapshot.events.some((event) => event.type === "approval.required"));
  });

  it("rejects browser-origin mutations even when the origin is local", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`, {
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
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.ok, false);
    assert.match(body.errors[0], /Browser-origin/);
  });

  it("rejects malformed task inputs", async () => {
    const server = await listen(createStageRunnerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_HARNESS_RUNNER_ROUTE}/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "Missing fields"
      })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.match(body.errors[0], /requires threadId/);
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
