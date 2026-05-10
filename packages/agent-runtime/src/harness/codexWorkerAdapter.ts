import type {
  HarnessAdapter,
  HarnessRunResult,
  HarnessTask,
  HarnessWorkspace
} from "./harnessTypes";

export type CodexWorkerTransport = "cli" | "app_server";

export type CodexWorkerExecutionMode = "dry_run";

export type CodexWorkerPolicy = {
  allowNetwork: boolean;
  allowPush: boolean;
  requireHumanReview: boolean;
  requireValidation: boolean;
};

export type CodexWorkerEnvelope = {
  provider: "openai_codex";
  transport: CodexWorkerTransport;
  executionMode: CodexWorkerExecutionMode;
  taskId: string;
  threadId: string;
  title: string;
  workspacePath: string;
  prompt: string;
  validationCommands: string[];
  policy: CodexWorkerPolicy;
};

export type CodexWorkerAdapterOptions = {
  transport?: CodexWorkerTransport;
  validationCommands?: string[];
  policy?: Partial<CodexWorkerPolicy>;
};

const defaultCodexWorkerPolicy: CodexWorkerPolicy = {
  allowNetwork: false,
  allowPush: false,
  requireHumanReview: true,
  requireValidation: true
};

const defaultValidationCommands = ["pnpm typecheck", "pnpm lint", "pnpm test"];

export function createCodexWorkerEnvelope(
  task: HarnessTask,
  options: CodexWorkerAdapterOptions = {}
): CodexWorkerEnvelope {
  if (task.kind !== "codex") {
    throw new Error(`Codex worker can only prepare codex tasks, received ${task.kind}.`);
  }

  if (task.approvalRequired) {
    throw new Error("Codex worker envelope requires approval before preparation.");
  }

  const workspace = requireApprovedWorkspace(task.workspace);
  const validationCommands = options.validationCommands ?? defaultValidationCommands;

  return {
    provider: "openai_codex",
    transport: options.transport ?? "cli",
    executionMode: "dry_run",
    taskId: task.id,
    threadId: task.threadId,
    title: task.title,
    workspacePath: workspace.path,
    prompt: createCodexWorkerPrompt(task, validationCommands),
    validationCommands,
    policy: {
      ...defaultCodexWorkerPolicy,
      ...options.policy
    }
  };
}

export function createDryRunCodexWorkerAdapter(
  options: CodexWorkerAdapterOptions = {}
): HarnessAdapter {
  return {
    id: "codex_worker_adapter_dry_run",
    label: "Codex worker adapter",
    mode: "codex",
    accepts: ["codex"],
    canRun: (task) =>
      task.kind === "codex" &&
      !task.approvalRequired &&
      isApprovedHarnessWorkspace(task.workspace),
    run: (task) => createDryRunCodexResult(createCodexWorkerEnvelope(task, options))
  };
}

export function isApprovedHarnessWorkspace(workspace: HarnessWorkspace | undefined): boolean {
  if (!workspace || workspace.kind !== "local") {
    return false;
  }

  const normalizedPath = workspace.path.trim();

  return (
    normalizedPath.startsWith(".blackstage/workspaces/") &&
    !normalizedPath.includes("..") &&
    !normalizedPath.startsWith("/") &&
    !normalizedPath.startsWith("~")
  );
}

function requireApprovedWorkspace(workspace: HarnessWorkspace | undefined): HarnessWorkspace {
  if (!workspace) {
    throw new Error("Codex worker requires an approved local workspace boundary.");
  }

  if (!isApprovedHarnessWorkspace(workspace)) {
    throw new Error("Codex worker requires an approved local workspace boundary.");
  }

  return workspace;
}

function createDryRunCodexResult(envelope: CodexWorkerEnvelope): HarnessRunResult {
  return {
    status: "completed",
    summary: `Prepared dry-run Codex worker envelope for ${envelope.title}.`,
    events: [
      {
        type: "task.progress",
        summary: "Prepared Codex worker prompt and workspace boundary.",
        payload: {
          provider: envelope.provider,
          transport: envelope.transport,
          execution_mode: envelope.executionMode,
          workspace_path: envelope.workspacePath
        }
      },
      {
        type: "task.progress",
        summary: "Validation commands and human review policy attached.",
        payload: {
          validation_commands: envelope.validationCommands,
          require_human_review: envelope.policy.requireHumanReview,
          allow_push: envelope.policy.allowPush,
          allow_network: envelope.policy.allowNetwork
        }
      }
    ]
  };
}

function createCodexWorkerPrompt(task: HarnessTask, validationCommands: string[]): string {
  return [
    `Task: ${task.title}`,
    "",
    "Objective:",
    task.objective,
    "",
    "Blackstage operating rules:",
    "- Work only inside the approved task workspace.",
    "- Emit progress as structured harness events.",
    "- Do not push, publish, or call external services without an approval event.",
    "- Return validation evidence and an artifact manifest for human review.",
    "",
    "Validation commands:",
    ...validationCommands.map((command) => `- ${command}`)
  ].join("\n");
}
