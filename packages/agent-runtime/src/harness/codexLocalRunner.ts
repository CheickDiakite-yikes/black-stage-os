import {
  createCodexWorkerEnvelope,
  isApprovedHarnessWorkspace,
  type CodexWorkerEnvelope
} from "./codexWorkerAdapter.js";
import type {
  HarnessAdapter,
  HarnessRunResult,
  HarnessTask
} from "./harnessTypes";

export type CodexLocalRunnerSandbox = "read-only" | "workspace-write";

export type CodexLocalRunnerApprovalPolicy = "never" | "on-request" | "untrusted";

export type CodexCommandPlan = {
  command: string;
  args: string[];
  cwd: string;
  stdin: string;
  env: Record<string, string>;
};

export type CodexCommandExecution = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type CodexCommandExecutor = (
  plan: CodexCommandPlan
) => CodexCommandExecution | Promise<CodexCommandExecution>;

export type CodexLocalRunnerOptions = {
  enabled?: boolean;
  codexBinary?: string;
  sandbox?: CodexLocalRunnerSandbox;
  approvalPolicy?: CodexLocalRunnerApprovalPolicy;
  jsonEvents?: boolean;
  ephemeral?: boolean;
  executor?: CodexCommandExecutor;
};

export type CodexLocalRunnerInspection = {
  allowed: boolean;
  reason?: string;
  warnings: string[];
};

export function createLocalCodexWorkerAdapter(
  options: CodexLocalRunnerOptions = {}
): HarnessAdapter {
  return {
    id: "codex_worker_adapter_local",
    label: "Local Codex worker adapter",
    mode: "codex",
    accepts: ["codex"],
    canRun: (task) =>
      task.kind === "codex" &&
      !task.approvalRequired &&
      isApprovedHarnessWorkspace(task.workspace),
    run: (task) => runLocalCodexWorker(createLocalCodexEnvelope(task), options)
  };
}

export async function runLocalCodexWorker(
  envelope: CodexWorkerEnvelope,
  options: CodexLocalRunnerOptions = {}
): Promise<HarnessRunResult> {
  const inspection = inspectLocalCodexRunnerReadiness(envelope, options);

  if (!inspection.allowed) {
    return {
      status: "blocked",
      summary: inspection.reason ?? "Local Codex worker is not ready.",
      events: [
        {
          type: "task.blocked",
          summary: inspection.reason ?? "Local Codex worker blocked before execution.",
          payload: {
            provider: envelope.provider,
            execution_mode: envelope.executionMode,
            workspace_path: envelope.workspacePath,
            warnings: inspection.warnings
          }
        }
      ]
    };
  }

  const plan = createCodexCommandPlan(envelope, options);
  const execution = await options.executor?.(plan);

  if (!execution) {
    return {
      status: "blocked",
      summary: "Local Codex worker needs an injected executor before it can run.",
      events: [
        {
          type: "task.blocked",
          summary: "No Codex command executor was configured.",
          payload: {
            command: plan.command,
            args: plan.args,
            cwd: plan.cwd
          }
        }
      ]
    };
  }

  const completed = execution.exitCode === 0;

  return {
    status: completed ? "completed" : "failed",
    summary: completed
      ? `Local Codex worker completed ${envelope.title}.`
      : `Local Codex worker failed ${envelope.title}.`,
    events: [
      {
        type: "task.progress",
        summary: "Local Codex command plan executed through injected runner.",
        payload: {
          command: plan.command,
          args: plan.args,
          cwd: plan.cwd,
          exit_code: execution.exitCode
        }
      },
      {
        type: completed ? "task.progress" : "task.failed",
        summary: completed ? "Local Codex worker returned proof." : "Local Codex worker returned failure proof.",
        payload: {
          stdout_excerpt: excerpt(execution.stdout),
          stderr_excerpt: excerpt(execution.stderr)
        }
      }
    ]
  };
}

export function createCodexCommandPlan(
  envelope: CodexWorkerEnvelope,
  options: CodexLocalRunnerOptions = {}
): CodexCommandPlan {
  const args = [
    "exec",
    "--cd",
    envelope.workspacePath,
    "--sandbox",
    options.sandbox ?? "workspace-write",
    "--ask-for-approval",
    options.approvalPolicy ?? "never"
  ];

  if (options.jsonEvents ?? true) {
    args.push("--json");
  }

  if (options.ephemeral ?? true) {
    args.push("--ephemeral");
  }

  args.push("-");

  return {
    command: options.codexBinary ?? "codex",
    args,
    cwd: envelope.workspacePath,
    stdin: envelope.prompt,
    env: {
      BLACKSTAGE_HARNESS_TASK_ID: envelope.taskId,
      BLACKSTAGE_THREAD_ID: envelope.threadId,
      BLACKSTAGE_CODEX_EXECUTION_MODE: envelope.executionMode
    }
  };
}

export function inspectLocalCodexRunnerReadiness(
  envelope: CodexWorkerEnvelope,
  options: CodexLocalRunnerOptions = {}
): CodexLocalRunnerInspection {
  const warnings: string[] = [];

  if (!options.enabled) {
    return {
      allowed: false,
      reason: "Local Codex worker is disabled by default.",
      warnings
    };
  }

  if (envelope.executionMode !== "local_exec") {
    warnings.push("Codex envelope must opt into local_exec mode.");
  }

  if (
    !isApprovedHarnessWorkspace({
      kind: "local",
      path: envelope.workspacePath
    })
  ) {
    warnings.push("Codex worker workspace is outside the approved Blackstage boundary.");
  }

  if (envelope.policy.allowPush) {
    warnings.push("Codex worker cannot push from the local runner.");
  }

  if (!envelope.policy.requireHumanReview) {
    warnings.push("Codex worker output must require human review.");
  }

  if (envelope.policy.requireValidation && envelope.validationCommands.length === 0) {
    warnings.push("Codex worker requires validation commands.");
  }

  if ((options.sandbox ?? "workspace-write") === "read-only" && envelope.executionMode === "local_exec") {
    warnings.push("Read-only sandbox cannot perform a coding worker task.");
  }

  return {
    allowed: warnings.length === 0,
    reason: warnings.length > 0 ? warnings[0] : undefined,
    warnings
  };
}

function createLocalCodexEnvelope(task: HarnessTask): CodexWorkerEnvelope {
  return createCodexWorkerEnvelope(task, {
    executionMode: "local_exec"
  });
}

function excerpt(text: string, limit = 500): string {
  const normalized = text.trim().replace(/\s+/g, " ");

  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}
