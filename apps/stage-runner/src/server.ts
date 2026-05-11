import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  BLACKSTAGE_HARNESS_RUNNER_ROUTE,
  type HarnessRunnerReadinessBody
} from "../../../packages/agent-runtime/dist/harness/harnessRunnerClient.js";
import {
  createDryRunAgentsSdkAdapter
} from "../../../packages/agent-runtime/dist/harness/agentsSdkAdapter.js";
import {
  createDryRunCodexWorkerAdapter
} from "../../../packages/agent-runtime/dist/harness/codexWorkerAdapter.js";
import {
  InMemoryHarnessScheduler
} from "../../../packages/agent-runtime/dist/harness/inMemoryHarnessScheduler.js";
import {
  createSimulatedHarnessAdapter
} from "../../../packages/agent-runtime/dist/harness/simulatedHarnessAdapter.js";
import {
  createSymphonyControlPlaneSnapshot
} from "../../../packages/agent-runtime/dist/harness/symphonyControlPlane.js";
import type {
  HarnessSchedulerSnapshot,
  HarnessTaskInput,
  HarnessTaskKind
} from "../../../packages/agent-runtime/dist/harness/harnessTypes.js";

export { BLACKSTAGE_HARNESS_RUNNER_ROUTE } from "../../../packages/agent-runtime/dist/harness/harnessRunnerClient.js";

export const DEFAULT_STAGE_RUNNER_HOST = "127.0.0.1";
export const DEFAULT_STAGE_RUNNER_PORT = 8797;
export const DEFAULT_STAGE_RUNNER_ALLOWED_ORIGINS = [
  "http://127.0.0.1:4187",
  "http://localhost:4187"
];
export const STAGE_RUNNER_ALLOWED_ORIGINS_ENV_VAR = "BLACKSTAGE_RUNNER_ALLOWED_ORIGINS";

export type StageRunnerRuntimeConfig = {
  host: string;
  port: number;
  routePath: string;
  allowedOrigins: string[];
};

export type StageRunnerServerOptions = {
  runtimeConfig?: Partial<StageRunnerRuntimeConfig>;
  scheduler?: InMemoryHarnessScheduler;
  now?: () => string;
};

type StageRunnerSnapshotResponse = {
  ok: true;
  snapshot: HarnessSchedulerSnapshot;
  controlPlane: ReturnType<typeof createSymphonyControlPlaneSnapshot>;
  checkedAt: string;
};

const harnessTaskKinds = new Set<HarnessTaskKind>([
  "codex",
  "agent",
  "voice",
  "research",
  "artifact"
]);

export function createStageRunnerRuntimeConfig(
  env: Record<string, string | undefined> = process.env
): StageRunnerRuntimeConfig {
  return {
    host: env.BLACKSTAGE_RUNNER_HOST ?? DEFAULT_STAGE_RUNNER_HOST,
    port: Number(env.BLACKSTAGE_RUNNER_PORT ?? DEFAULT_STAGE_RUNNER_PORT),
    routePath: env.BLACKSTAGE_HARNESS_RUNNER_ROUTE ?? BLACKSTAGE_HARNESS_RUNNER_ROUTE,
    allowedOrigins: parseAllowedOrigins(env[STAGE_RUNNER_ALLOWED_ORIGINS_ENV_VAR])
  };
}

export function createDefaultStageRunnerScheduler(now?: () => string): InMemoryHarnessScheduler {
  return new InMemoryHarnessScheduler({
    adapters: [
      createDryRunCodexWorkerAdapter(),
      createDryRunAgentsSdkAdapter(),
      createSimulatedHarnessAdapter(["voice"])
    ],
    now
  });
}

export function createStageRunnerServer(options: StageRunnerServerOptions = {}): Server {
  const runtimeConfig = resolveStageRunnerRuntimeConfig(options.runtimeConfig);
  const scheduler = options.scheduler ?? createDefaultStageRunnerScheduler(options.now);

  return createServer((request, response) => {
    void handleStageRunnerRequest(request, response, runtimeConfig, scheduler);
  });
}

export async function startStageRunnerServer(
  options: StageRunnerServerOptions = {}
): Promise<Server> {
  const runtimeConfig = resolveStageRunnerRuntimeConfig(options.runtimeConfig);
  const server = createStageRunnerServer({
    ...options,
    runtimeConfig
  });

  await new Promise<void>((resolve) => {
    server.listen(runtimeConfig.port, runtimeConfig.host, resolve);
  });

  return server;
}

function resolveStageRunnerRuntimeConfig(
  overrides?: Partial<StageRunnerRuntimeConfig>
): StageRunnerRuntimeConfig {
  return {
    ...createStageRunnerRuntimeConfig(),
    ...overrides
  };
}

async function handleStageRunnerRequest(
  request: IncomingMessage,
  response: ServerResponse,
  runtimeConfig: StageRunnerRuntimeConfig,
  scheduler: InMemoryHarnessScheduler
): Promise<void> {
  const routeUrl = new URL(request.url ?? "/", `http://${runtimeConfig.host}:${runtimeConfig.port}`);
  const method = request.method?.toUpperCase() ?? "GET";
  const corsHeaders = createCorsHeaders(request, runtimeConfig);
  const snapshotPath = `${runtimeConfig.routePath}/snapshot`;
  const tasksPath = `${runtimeConfig.routePath}/tasks`;
  const runNextPath = `${runtimeConfig.routePath}/run-next`;

  if (routeUrl.pathname.startsWith(runtimeConfig.routePath) && method === "OPTIONS") {
    response.writeHead(204, {
      ...corsHeaders
    });
    response.end();
    return;
  }

  if (routeUrl.pathname === runtimeConfig.routePath && method === "GET") {
    writeJson(response, 200, createReadinessResponse(runtimeConfig, new Date().toISOString()), corsHeaders);
    return;
  }

  if (routeUrl.pathname === snapshotPath && method === "GET") {
    writeJson(response, 200, createSnapshotResponse(scheduler, new Date().toISOString()), corsHeaders);
    return;
  }

  if ((routeUrl.pathname === tasksPath || routeUrl.pathname === runNextPath) && request.headers.origin) {
    writeJson(
      response,
      403,
      {
        ok: false,
        errors: ["Browser-origin harness mutations are disabled in this local runner slice."]
      },
      corsHeaders
    );
    return;
  }

  if (routeUrl.pathname === tasksPath && method === "POST") {
    const parsed = parseHarnessTaskInput(await readJsonBody(request));

    if (!parsed.ok) {
      writeJson(response, 400, parsed, corsHeaders);
      return;
    }

    const task = scheduler.enqueueTask(parsed.task);

    writeJson(
      response,
      202,
      {
        ok: true,
        task,
        snapshot: scheduler.getSnapshot()
      },
      corsHeaders
    );
    return;
  }

  if (routeUrl.pathname === runNextPath && method === "POST") {
    const run = await scheduler.runNext();

    writeJson(
      response,
      200,
      {
        run: run ?? null,
        ...createSnapshotResponse(scheduler, new Date().toISOString())
      },
      corsHeaders
    );
    return;
  }

  writeJson(
    response,
    404,
    {
      ok: false,
      errors: ["Harness runner route not found."]
    },
    corsHeaders
  );
}

function createReadinessResponse(
  runtimeConfig: StageRunnerRuntimeConfig,
  checkedAt: string
): HarnessRunnerReadinessBody {
  return {
    ok: true,
    route: runtimeConfig.routePath,
    orchestration: "symphony_style_internal_queue",
    codexMode: "dry_run",
    agentsSdkMode: "dry_run",
    localCodexSubprocessEnabled: false,
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    checkedAt
  };
}

function createSnapshotResponse(
  scheduler: InMemoryHarnessScheduler,
  checkedAt: string
): StageRunnerSnapshotResponse {
  const snapshot = scheduler.getSnapshot();

  return {
    ok: true,
    snapshot,
    controlPlane: createSymphonyControlPlaneSnapshot(snapshot),
    checkedAt
  };
}

function createCorsHeaders(
  request: IncomingMessage,
  runtimeConfig: StageRunnerRuntimeConfig
): Record<string, string> {
  const origin = request.headers.origin;

  if (!origin || Array.isArray(origin) || !runtimeConfig.allowedOrigins.includes(origin)) {
    return {};
  }

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "accept, content-type",
    "access-control-max-age": "600",
    vary: "origin"
  };
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const body = await readRequestBody(request);

  if (!body.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseHarnessTaskInput(
  body: unknown
): { ok: true; task: HarnessTaskInput } | { ok: false; errors: string[] } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      errors: ["Expected a JSON harness task input."]
    };
  }

  const candidate = body as Partial<HarnessTaskInput>;

  if (
    typeof candidate.threadId !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.objective !== "string" ||
    !harnessTaskKinds.has(candidate.kind as HarnessTaskKind)
  ) {
    return {
      ok: false,
      errors: ["Harness task input requires threadId, title, objective, and kind."]
    };
  }

  if (
    candidate.workspace !== undefined &&
    (!candidate.workspace ||
      candidate.workspace.kind !== "local" ||
      typeof candidate.workspace.path !== "string" ||
      candidate.workspace.path.trim().length === 0)
  ) {
    return {
      ok: false,
      errors: ["Harness task workspace must be a local workspace with a path."]
    };
  }

  return {
    ok: true,
    task: {
      id: typeof candidate.id === "string" ? candidate.id : undefined,
      threadId: candidate.threadId,
      title: candidate.title,
      objective: candidate.objective,
      kind: candidate.kind as HarnessTaskKind,
      priority: typeof candidate.priority === "number" ? candidate.priority : undefined,
      approvalRequired:
        typeof candidate.approvalRequired === "boolean" ? candidate.approvalRequired : undefined,
      blockedBy: Array.isArray(candidate.blockedBy)
        ? candidate.blockedBy.filter((taskId): taskId is string => typeof taskId === "string")
        : undefined,
      workspace: candidate.workspace
    }
  };
}

function writeJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): void {
  response.writeHead(status, {
    "content-type": "application/json",
    ...headers
  });
  response.end(JSON.stringify(body));
}

function parseAllowedOrigins(value?: string): string[] {
  if (!value?.trim()) {
    return DEFAULT_STAGE_RUNNER_ALLOWED_ORIGINS;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const runtimeConfig = createStageRunnerRuntimeConfig();

  startStageRunnerServer({
    runtimeConfig
  })
    .then(() => {
      console.log(`Blackstage harness runner listening on http://${runtimeConfig.host}:${runtimeConfig.port}`);
      console.log(`Harness route: ${runtimeConfig.routePath}`);
      console.log("Codex and Agents SDK execution remain dry-run only in this slice.");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
