import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import {
  isApprovedHarnessWorkspace
} from "../../../packages/agent-runtime/dist/harness/codexWorkerAdapter.js";
import type {
  HarnessRun,
  HarnessSchedulerSnapshot,
  HarnessTaskInput,
  HarnessWorkspace
} from "../../../packages/agent-runtime/dist/harness/harnessTypes.js";

export const DEFAULT_STAGE_RUNNER_WORKSPACE_ROOT = ".blackstage/workspaces";
export const STAGE_RUNNER_WORKSPACE_MANIFEST = "blackstage-task.json";
export const STAGE_RUNNER_RUN_PROOF = "blackstage-run.json";

export type StageRunnerWorkspaceManifest = {
  manifestVersion: 1;
  taskId: string;
  threadId: string;
  title: string;
  objective: string;
  kind: HarnessTaskInput["kind"];
  workspacePath: string;
  createdAt: string;
  policy: {
    browserMutationAllowed: false;
    humanReviewRequired: true;
    liveExecutionDefault: false;
  };
  validationStatus: "pending";
};

export type StageRunnerWorkspacePreparation = {
  taskInput: HarnessTaskInput;
  manifest?: StageRunnerWorkspaceManifest;
  manifestPath?: string;
};

export type StageRunnerRunProof = {
  proofVersion: 1;
  runId: string;
  taskId: string;
  adapterId: string;
  status: HarnessRun["status"];
  summary?: string;
  startedAt: string;
  completedAt?: string;
  eventCount: number;
  writtenAt: string;
  policy: {
    humanReviewRequired: true;
    browserMutationAllowed: false;
    externalActionTaken: false;
  };
};

export type StageRunnerWorkspaceManagerOptions = {
  repoRoot?: string;
  workspaceRoot?: string;
  now?: () => string;
};

export async function prepareStageRunnerTaskWorkspace(
  input: HarnessTaskInput,
  options: StageRunnerWorkspaceManagerOptions = {}
): Promise<StageRunnerWorkspacePreparation> {
  if (input.kind !== "codex") {
    return {
      taskInput: input
    };
  }

  const taskId = input.id ?? createStableTaskId(input);
  const workspace = input.workspace ?? createHarnessWorkspaceForTask(taskId, options.workspaceRoot);

  assertApprovedWorkspace(workspace);
  assertWorkspaceWithinRoot(workspace, options);

  const workspacePath = workspace.path;
  const absoluteWorkspacePath = resolve(options.repoRoot ?? process.cwd(), workspacePath);
  const createdAt = options.now?.() ?? new Date().toISOString();
  const taskInput: HarnessTaskInput = {
    ...input,
    id: taskId,
    workspace
  };
  const manifest: StageRunnerWorkspaceManifest = {
    manifestVersion: 1,
    taskId,
    threadId: input.threadId,
    title: input.title,
    objective: input.objective,
    kind: input.kind,
    workspacePath,
    createdAt,
    policy: {
      browserMutationAllowed: false,
      humanReviewRequired: true,
      liveExecutionDefault: false
    },
    validationStatus: "pending"
  };

  await mkdir(absoluteWorkspacePath, {
    recursive: true
  });
  await writeFile(
    join(absoluteWorkspacePath, STAGE_RUNNER_WORKSPACE_MANIFEST),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  return {
    taskInput,
    manifest,
    manifestPath: `${workspacePath}/${STAGE_RUNNER_WORKSPACE_MANIFEST}`
  };
}

export async function writeStageRunnerRunProof(
  run: HarnessRun,
  snapshot: HarnessSchedulerSnapshot,
  options: StageRunnerWorkspaceManagerOptions = {}
): Promise<{
  proof: StageRunnerRunProof;
  proofPath: string;
} | undefined> {
  const task = snapshot.tasks.find((candidate) => candidate.id === run.taskId);

  if (!task?.workspace) {
    return undefined;
  }

  assertApprovedWorkspace(task.workspace);
  assertWorkspaceWithinRoot(task.workspace, options);

  const workspacePath = task.workspace.path;
  const absoluteWorkspacePath = resolve(options.repoRoot ?? process.cwd(), workspacePath);
  const writtenAt = options.now?.() ?? new Date().toISOString();
  const proof: StageRunnerRunProof = {
    proofVersion: 1,
    runId: run.id,
    taskId: run.taskId,
    adapterId: run.adapterId,
    status: run.status,
    summary: run.summary,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    eventCount: snapshot.events.filter((event) => event.taskId === run.taskId).length,
    writtenAt,
    policy: {
      humanReviewRequired: true,
      browserMutationAllowed: false,
      externalActionTaken: false
    }
  };

  await mkdir(absoluteWorkspacePath, {
    recursive: true
  });
  await writeFile(
    join(absoluteWorkspacePath, STAGE_RUNNER_RUN_PROOF),
    `${JSON.stringify(proof, null, 2)}\n`,
    "utf8"
  );

  return {
    proof,
    proofPath: `${workspacePath}/${STAGE_RUNNER_RUN_PROOF}`
  };
}

export function createHarnessWorkspaceForTask(
  taskId: string,
  workspaceRoot = DEFAULT_STAGE_RUNNER_WORKSPACE_ROOT
): HarnessWorkspace {
  return {
    kind: "local",
    path: `${workspaceRoot.replace(/\/+$/, "")}/${slugify(taskId)}`
  };
}

export function createStableTaskId(input: Pick<HarnessTaskInput, "title" | "objective">): string {
  const slug = slugify(input.title || "codex-task");
  const hash = stableHash(`${input.title}\n${input.objective}`);

  return `task_${slug}_${hash}`;
}

function assertApprovedWorkspace(workspace: HarnessWorkspace): void {
  if (!isApprovedHarnessWorkspace(workspace)) {
    throw new Error("Codex task workspace must stay inside .blackstage/workspaces/.");
  }
}

function assertWorkspaceWithinRoot(
  workspace: HarnessWorkspace,
  options: StageRunnerWorkspaceManagerOptions
): void {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const workspaceRoot = resolve(repoRoot, options.workspaceRoot ?? DEFAULT_STAGE_RUNNER_WORKSPACE_ROOT);
  const absoluteWorkspacePath = resolve(repoRoot, workspace.path);

  if (
    absoluteWorkspacePath !== workspaceRoot &&
    !absoluteWorkspacePath.startsWith(`${workspaceRoot}${sep}`)
  ) {
    throw new Error("Codex task workspace escaped the configured workspace root.");
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "task";
}

function stableHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}
