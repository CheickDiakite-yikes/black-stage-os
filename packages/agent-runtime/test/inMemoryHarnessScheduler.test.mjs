import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createBuildBlackstageHarnessSnapshot,
  projectHarnessSnapshotToStageEvents
} from "../dist/harness/harnessStageProjection.js";
import {
  createCodexWorkerEnvelope,
  createDryRunCodexWorkerAdapter,
  isApprovedHarnessWorkspace
} from "../dist/harness/codexWorkerAdapter.js";
import {
  createCodexCommandPlan,
  createLocalCodexWorkerAdapter,
  inspectLocalCodexRunnerReadiness
} from "../dist/harness/codexLocalRunner.js";
import { InMemoryHarnessScheduler } from "../dist/harness/inMemoryHarnessScheduler.js";
import { createSimulatedHarnessAdapter } from "../dist/harness/simulatedHarnessAdapter.js";
import { createSymphonyControlPlaneSnapshot } from "../dist/harness/symphonyControlPlane.js";

const now = () => "2026-05-10T22:45:00.000Z";

describe("InMemoryHarnessScheduler", () => {
  it("runs queued local tasks through a simulated adapter", async () => {
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [createSimulatedHarnessAdapter()],
      now
    });

    const task = scheduler.enqueueTask({
      id: "task_codex_plan",
      threadId: "thread_build_blackstage",
      title: "Draft Codex implementation plan",
      objective: "Create a small validated implementation plan.",
      kind: "codex",
      workspace: {
        kind: "local",
        path: ".blackstage/workspaces/task_codex_plan"
      }
    });
    const run = await scheduler.runNext();
    const snapshot = scheduler.getSnapshot();

    assert.equal(task.status, "queued");
    assert.equal(run?.status, "completed");
    assert.equal(snapshot.tasks[0]?.status, "completed");
    assert.equal(snapshot.runs.length, 1);
    assert.ok(snapshot.events.some((event) => event.type === "task.completed"));
    assert.ok(
      snapshot.events.some(
        (event) => event.payload?.workspace_path === ".blackstage/workspaces/task_codex_plan"
      )
    );
  });

  it("blocks approval-required tasks before any adapter runs", async () => {
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [createSimulatedHarnessAdapter()],
      now
    });

    scheduler.enqueueTask({
      id: "task_publish_prompt",
      threadId: "thread_build_blackstage",
      title: "Publish Codex task prompts",
      objective: "Create externally visible task prompts.",
      kind: "codex",
      approvalRequired: true
    });
    const run = await scheduler.runNext();
    const snapshot = scheduler.getSnapshot();

    assert.equal(run, undefined);
    assert.equal(snapshot.tasks[0]?.status, "blocked");
    assert.equal(snapshot.runs.length, 0);
    assert.ok(snapshot.events.some((event) => event.type === "approval.required"));
  });

  it("waits for dependencies before running follow-up tasks", async () => {
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [createSimulatedHarnessAdapter()],
      now
    });

    scheduler.enqueueTask({
      id: "task_first",
      threadId: "thread_build_blackstage",
      title: "Create harness contracts",
      objective: "Define the local harness contracts.",
      kind: "agent",
      priority: 1
    });
    scheduler.enqueueTask({
      id: "task_second",
      threadId: "thread_build_blackstage",
      title: "Render harness events",
      objective: "Make harness events visible on the stage.",
      kind: "artifact",
      priority: 10,
      blockedBy: ["task_first"]
    });

    const firstRun = await scheduler.runNext();
    const secondRun = await scheduler.runNext();
    const snapshot = scheduler.getSnapshot();

    assert.equal(firstRun?.taskId, "task_first");
    assert.equal(secondRun?.taskId, "task_second");
    assert.deepEqual(
      snapshot.tasks.map((task) => task.status),
      ["completed", "completed"]
    );
  });
});

describe("Harness stage projection", () => {
  it("projects scheduler proof into replayable stage events", () => {
    const snapshot = createBuildBlackstageHarnessSnapshot(
      "thread_build_blackstage",
      "2026-05-10T22:50:00.000Z"
    );
    const stageEvents = projectHarnessSnapshotToStageEvents(
      snapshot,
      "thread_build_blackstage",
      "2026-05-10T22:50:00.000Z",
      100
    );

    assert.ok(
      stageEvents.some(
        (event) =>
          event.event.type === "object.created" &&
          event.event.payload.title === "Background harness recorder"
      )
    );
    assert.ok(
      stageEvents.some(
        (event) =>
          event.event.type === "agent.progress" &&
          event.event.payload.summary === "Replayable failure captured."
      )
    );
    assert.ok(
      stageEvents.some(
        (event) =>
          event.event.type === "agent.progress" &&
          event.event.payload.summary === "Approval gate blocked workspace write."
      )
    );
  });
});

describe("Codex worker adapter", () => {
  it("prepares a dry-run Codex worker envelope inside an approved workspace", async () => {
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [createDryRunCodexWorkerAdapter()],
      now
    });

    scheduler.enqueueTask({
      id: "task_codex_worker",
      threadId: "thread_build_blackstage",
      title: "Implement Stage Shell speech output",
      objective: "Add sparse assistant speech and validation proof.",
      kind: "codex",
      workspace: {
        kind: "local",
        path: ".blackstage/workspaces/task_codex_worker"
      }
    });
    const run = await scheduler.runNext();
    const snapshot = scheduler.getSnapshot();

    assert.equal(run?.adapterId, "codex_worker_adapter_dry_run");
    assert.equal(run?.status, "completed");
    assert.ok(
      snapshot.events.some(
        (event) =>
          event.type === "task.progress" &&
          event.payload?.provider === "openai_codex" &&
          event.payload?.execution_mode === "dry_run"
      )
    );
  });

  it("rejects Codex worker envelopes outside the approved workspace boundary", () => {
    assert.equal(
      isApprovedHarnessWorkspace({
        kind: "local",
        path: ".blackstage/workspaces/task_safe"
      }),
      true
    );
    assert.equal(
      isApprovedHarnessWorkspace({
        kind: "local",
        path: "../outside"
      }),
      false
    );
    assert.throws(
      () =>
        createCodexWorkerEnvelope({
          id: "task_unsafe",
          threadId: "thread_build_blackstage",
          title: "Unsafe workspace",
          objective: "Should be blocked.",
          kind: "codex",
          status: "queued",
          priority: 0,
          approvalRequired: false,
          blockedBy: [],
          workspace: {
            kind: "local",
            path: "/tmp/outside"
          },
          createdAt: now(),
          updatedAt: now()
        }),
      /approved local workspace/
    );
  });
});

describe("Local Codex runner", () => {
  it("blocks local execution by default before invoking an executor", async () => {
    let executorCalls = 0;
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [
        createLocalCodexWorkerAdapter({
          executor: () => {
            executorCalls += 1;
            return {
              exitCode: 0,
              stdout: "should not run",
              stderr: ""
            };
          }
        })
      ],
      now
    });

    scheduler.enqueueTask({
      id: "task_disabled_runner",
      threadId: "thread_build_blackstage",
      title: "Try disabled runner",
      objective: "This must not execute without explicit enablement.",
      kind: "codex",
      workspace: {
        kind: "local",
        path: ".blackstage/workspaces/task_disabled_runner"
      }
    });
    const run = await scheduler.runNext();
    const snapshot = scheduler.getSnapshot();

    assert.equal(executorCalls, 0);
    assert.equal(run?.status, "blocked");
    assert.equal(snapshot.tasks[0]?.status, "blocked");
    assert.ok(snapshot.events.some((event) => event.type === "task.blocked"));
  });

  it("creates an explicit Codex exec command plan for approved local workspaces", () => {
    const envelope = createCodexWorkerEnvelope(
      {
        id: "task_plan_command",
        threadId: "thread_build_blackstage",
        title: "Plan command",
        objective: "Create a command plan.",
        kind: "codex",
        status: "queued",
        priority: 0,
        approvalRequired: false,
        blockedBy: [],
        workspace: {
          kind: "local",
          path: ".blackstage/workspaces/task_plan_command"
        },
        createdAt: now(),
        updatedAt: now()
      },
      {
        executionMode: "local_exec"
      }
    );
    const plan = createCodexCommandPlan(envelope);
    const readiness = inspectLocalCodexRunnerReadiness(envelope, {
      enabled: true
    });

    assert.equal(readiness.allowed, true);
    assert.equal(plan.command, "codex");
    assert.deepEqual(plan.args.slice(0, 7), [
      "exec",
      "--cd",
      ".blackstage/workspaces/task_plan_command",
      "--sandbox",
      "workspace-write",
      "--ask-for-approval",
      "never"
    ]);
    assert.ok(plan.args.includes("--json"));
    assert.ok(plan.args.includes("--ephemeral"));
    assert.equal(plan.args.at(-1), "-");
    assert.equal(plan.cwd, ".blackstage/workspaces/task_plan_command");
    assert.match(plan.stdin, /Return validation evidence/);
    assert.equal(plan.env.BLACKSTAGE_HARNESS_TASK_ID, "task_plan_command");
  });

  it("runs through an injected executor only when explicitly enabled", async () => {
    let commandPlan;
    const scheduler = new InMemoryHarnessScheduler({
      adapters: [
        createLocalCodexWorkerAdapter({
          enabled: true,
          executor: (plan) => {
            commandPlan = plan;
            return {
              exitCode: 0,
              stdout: "validated patch packet",
              stderr: ""
            };
          }
        })
      ],
      now
    });

    scheduler.enqueueTask({
      id: "task_enabled_runner",
      threadId: "thread_build_blackstage",
      title: "Run enabled local runner",
      objective: "Exercise the local runner seam with an injected executor.",
      kind: "codex",
      workspace: {
        kind: "local",
        path: ".blackstage/workspaces/task_enabled_runner"
      }
    });
    const run = await scheduler.runNext();
    const snapshot = scheduler.getSnapshot();

    assert.equal(run?.status, "completed");
    assert.equal(commandPlan?.command, "codex");
    assert.equal(commandPlan?.cwd, ".blackstage/workspaces/task_enabled_runner");
    assert.ok(
      snapshot.events.some(
        (event) =>
          event.type === "task.progress" &&
          event.payload?.exit_code === 0 &&
          event.payload?.cwd === ".blackstage/workspaces/task_enabled_runner"
      )
    );
  });
});

describe("Symphony control plane", () => {
  it("projects harness tasks into an internal Symphony-style queue", () => {
    const snapshot = createBuildBlackstageHarnessSnapshot(
      "thread_build_blackstage",
      "2026-05-10T23:10:00.000Z"
    );
    const controlPlane = createSymphonyControlPlaneSnapshot(snapshot);

    assert.equal(controlPlane.kind, "blackstage_internal_queue");
    assert.equal(controlPlane.workItems.length, 4);
    assert.equal(controlPlane.blockedCount, 1);
    assert.ok(
      controlPlane.workItems.some(
        (item) =>
          item.id.endsWith("_approval_gate") &&
          item.lane === "needs_approval" &&
          item.approvalRequired
      )
    );
    assert.ok(
      controlPlane.workItems.some(
        (item) => item.id.endsWith("_codex_run") && item.lane === "human_review"
      )
    );
  });
});
