import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type {
  CodexCommandExecution,
  CodexCommandExecutor,
  CodexCommandPlan
} from "../../../packages/agent-runtime/dist/harness/codexLocalRunner.js";

export type CodexProcessSpawner = (
  command: string,
  args: string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    shell: false;
    stdio: "pipe";
  }
) => ChildProcessWithoutNullStreams;

export type NodeCodexCommandExecutorOptions = {
  spawnImpl?: CodexProcessSpawner;
  timeoutMs?: number;
  outputLimit?: number;
};

const DEFAULT_CODEX_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_CODEX_OUTPUT_LIMIT = 40_000;

export function createNodeCodexCommandExecutor(
  options: NodeCodexCommandExecutorOptions = {}
): CodexCommandExecutor {
  const spawnImpl = options.spawnImpl ?? spawn;
  const timeoutMs = options.timeoutMs ?? DEFAULT_CODEX_TIMEOUT_MS;
  const outputLimit = options.outputLimit ?? DEFAULT_CODEX_OUTPUT_LIMIT;

  return (plan) =>
    new Promise<CodexCommandExecution>((resolve) => {
      let resolved = false;
      let stdout = "";
      let stderr = "";
      const child = spawnImpl(plan.command, plan.args, {
        cwd: plan.cwd,
        env: {
          ...process.env,
          ...plan.env
        },
        shell: false,
        stdio: "pipe"
      });
      const timeout = setTimeout(() => {
        stderr = appendLimited(stderr, "Local Codex worker timed out.", outputLimit);
        child.kill("SIGTERM");
        finish(124);
      }, timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout = appendLimited(stdout, chunk, outputLimit);
      });
      child.stderr.on("data", (chunk) => {
        stderr = appendLimited(stderr, chunk, outputLimit);
      });
      child.on("error", (error) => {
        stderr = appendLimited(stderr, error.message, outputLimit);
        finish(1);
      });
      child.on("close", (code) => {
        finish(code ?? 1);
      });
      child.stdin.write(plan.stdin);
      child.stdin.end();

      function finish(exitCode: number): void {
        if (resolved) {
          return;
        }

        resolved = true;
        clearTimeout(timeout);
        resolve({
          exitCode,
          stdout,
          stderr
        });
      }
    });
}

function appendLimited(current: string, chunk: unknown, limit: number): string {
  const next = `${current}${String(chunk)}`;

  if (next.length <= limit) {
    return next;
  }

  return `${next.slice(0, limit)}\n[blackstage-output-truncated]`;
}

export function createCodexSubprocessPreview(plan: CodexCommandPlan): {
  command: string;
  args: string[];
  cwd: string;
  stdinBytes: number;
  envKeys: string[];
} {
  return {
    command: plan.command,
    args: plan.args,
    cwd: plan.cwd,
    stdinBytes: Buffer.byteLength(plan.stdin, "utf8"),
    envKeys: Object.keys(plan.env).sort()
  };
}
