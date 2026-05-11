import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  handleRealtimeUnifiedWebrtcBrokerRoute,
  type RealtimeBrokerOpenAiExchange,
  type RealtimeBrokerRouteEnvironment
} from "../../../packages/voice-core/dist/realtime/realtimeVoiceBrokerRoute.js";
import type { RealtimeBrokerReadinessBody } from "../../../packages/voice-core/dist/realtime/realtimeVoiceBrokerClient.js";
import { BLACKSTAGE_REALTIME_BROKER_ROUTE } from "../../../packages/voice-core/dist/realtime/realtimeVoiceServerBroker.js";
import { createRealtimeVoiceSessionConfig } from "../../../packages/voice-core/dist/realtime/realtimeVoiceSession.js";
import { createOpenAiRealtimeExchange } from "./openAiRealtimeExchange.js";

export { BLACKSTAGE_REALTIME_BROKER_ROUTE } from "../../../packages/voice-core/dist/realtime/realtimeVoiceServerBroker.js";

export const DEFAULT_STAGE_BROKER_HOST = "127.0.0.1";
export const DEFAULT_STAGE_BROKER_PORT = 8798;
export const DEFAULT_STAGE_BROKER_ALLOWED_ORIGINS = [
  "http://127.0.0.1:4187",
  "http://localhost:4187"
];
export const STAGE_BROKER_LIVE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE";
export const STAGE_BROKER_SAFETY_ENV_VAR = "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER";
export const STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR =
  "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN";
export const STAGE_BROKER_APPROVAL_HEADER = "x-blackstage-realtime-approval";
export const STAGE_BROKER_ALLOWED_ORIGINS_ENV_VAR = "BLACKSTAGE_BROKER_ALLOWED_ORIGINS";

export type StageBrokerRuntimeConfig = {
  host: string;
  port: number;
  routePath: string;
  allowedOrigins: string[];
  runApprovalToken?: string;
  environment: RealtimeBrokerRouteEnvironment;
};

export type StageBrokerServerOptions = {
  runtimeConfig?: Partial<StageBrokerRuntimeConfig>;
  exchangeWithOpenAi?: RealtimeBrokerOpenAiExchange;
};

export function createStageBrokerRuntimeConfig(
  env: Record<string, string | undefined> = process.env
): StageBrokerRuntimeConfig {
  return {
    host: env.BLACKSTAGE_BROKER_HOST ?? DEFAULT_STAGE_BROKER_HOST,
    port: Number(env.BLACKSTAGE_BROKER_PORT ?? DEFAULT_STAGE_BROKER_PORT),
    routePath: env.BLACKSTAGE_REALTIME_BROKER_ROUTE ?? BLACKSTAGE_REALTIME_BROKER_ROUTE,
    allowedOrigins: parseAllowedOrigins(env[STAGE_BROKER_ALLOWED_ORIGINS_ENV_VAR]),
    runApprovalToken: env[STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR],
    environment: {
      liveModeEnabled: env[STAGE_BROKER_LIVE_ENV_VAR] === "1",
      openAiApiKey: env.OPENAI_API_KEY,
      safetyIdentifier: env[STAGE_BROKER_SAFETY_ENV_VAR]
    }
  };
}

export function createStageBrokerServer(options: StageBrokerServerOptions = {}): Server {
  const runtimeConfig = resolveStageBrokerRuntimeConfig(options.runtimeConfig);
  const exchangeWithOpenAi = options.exchangeWithOpenAi ?? createOpenAiRealtimeExchange();

  return createServer((request, response) => {
    void handleStageBrokerRequest(request, response, runtimeConfig, exchangeWithOpenAi);
  });
}

export async function startStageBrokerServer(
  options: StageBrokerServerOptions = {}
): Promise<Server> {
  const runtimeConfig = resolveStageBrokerRuntimeConfig(options.runtimeConfig);
  const server = createStageBrokerServer({
    ...options,
    runtimeConfig
  });

  await new Promise<void>((resolve) => {
    server.listen(runtimeConfig.port, runtimeConfig.host, resolve);
  });

  return server;
}

function resolveStageBrokerRuntimeConfig(
  overrides?: Partial<StageBrokerRuntimeConfig>
): StageBrokerRuntimeConfig {
  const baseRuntimeConfig = createStageBrokerRuntimeConfig();

  return {
    ...baseRuntimeConfig,
    ...overrides,
    environment: {
      ...baseRuntimeConfig.environment,
      ...overrides?.environment
    }
  };
}

async function handleStageBrokerRequest(
  request: IncomingMessage,
  response: ServerResponse,
  runtimeConfig: StageBrokerRuntimeConfig,
  exchangeWithOpenAi?: RealtimeBrokerOpenAiExchange
): Promise<void> {
  const routeUrl = new URL(request.url ?? "/", `http://${runtimeConfig.host}:${runtimeConfig.port}`);
  const corsHeaders = createCorsHeaders(request, runtimeConfig);

  if (routeUrl.pathname === runtimeConfig.routePath && request.method?.toUpperCase() === "OPTIONS") {
    response.writeHead(204, {
      ...corsHeaders
    });
    response.end();
    return;
  }

  if (routeUrl.pathname === runtimeConfig.routePath && request.method?.toUpperCase() === "GET") {
    response.writeHead(200, {
      "content-type": "application/json",
      ...corsHeaders
    });
    response.end(JSON.stringify(createReadinessResponse(runtimeConfig, new Date().toISOString())));
    return;
  }

  if (
    routeUrl.pathname === runtimeConfig.routePath &&
    request.method?.toUpperCase() === "POST" &&
    !requestHasLiveRealtimeApproval(request, runtimeConfig)
  ) {
    response.writeHead(403, {
      "content-type": "application/json",
      ...corsHeaders
    });
    response.end(
      JSON.stringify({
        ok: false,
        errors: ["Live Realtime SDP exchange requires a matching local approval token."]
      })
    );
    return;
  }

  const body = await readRequestBody(request);
  const brokerResponse = await handleRealtimeUnifiedWebrtcBrokerRoute(
    {
      method: request.method ?? "GET",
      path: routeUrl.pathname,
      headers: normalizeHeaders(request.headers),
      body,
      requestedAt: new Date().toISOString()
    },
    {
      config: createRealtimeVoiceSessionConfig({
        sessionId: "stage_broker_local",
        threadId: "thread_stage_broker",
        networkMode: runtimeConfig.environment.liveModeEnabled ? "configured_live" : "simulation"
      }),
      environment: runtimeConfig.environment,
      serverRoute: runtimeConfig.routePath,
      exchangeWithOpenAi
    }
  );

  response.writeHead(brokerResponse.status, {
    ...brokerResponse.headers,
    ...corsHeaders
  });
  response.end(brokerResponse.body);
}

function createReadinessResponse(
  runtimeConfig: StageBrokerRuntimeConfig,
  checkedAt: string
): RealtimeBrokerReadinessBody {
  return {
    ok: true,
    route: runtimeConfig.routePath,
    liveModeEnabled: runtimeConfig.environment.liveModeEnabled === true,
    accepts: "application/sdp",
    browserSendsAudio: false,
    browserReceivesStandardApiKey: false,
    checkedAt
  };
}

function createCorsHeaders(
  request: IncomingMessage,
  runtimeConfig: StageBrokerRuntimeConfig
): Record<string, string> {
  const origin = request.headers.origin;

  if (!origin || Array.isArray(origin) || !runtimeConfig.allowedOrigins.includes(origin)) {
    return {};
  }

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": `accept, content-type, ${STAGE_BROKER_APPROVAL_HEADER}`,
    "access-control-max-age": "600",
    vary: "origin"
  };
}

function requestHasLiveRealtimeApproval(
  request: IncomingMessage,
  runtimeConfig: StageBrokerRuntimeConfig
): boolean {
  if (runtimeConfig.environment.liveModeEnabled !== true) {
    return true;
  }

  const requiredPhrase = runtimeConfig.runApprovalToken?.trim();
  const providedPhrase = readSingleHeader(request, STAGE_BROKER_APPROVAL_HEADER);

  return Boolean(requiredPhrase) && providedPhrase === requiredPhrase;
}

function readSingleHeader(request: IncomingMessage, headerName: string): string | undefined {
  const header = request.headers[headerName.toLowerCase()];

  if (Array.isArray(header)) {
    return undefined;
  }

  return header;
}

function normalizeHeaders(headers: IncomingMessage["headers"]): Record<string, string | undefined> {
  const normalizedHeaders: Record<string, string | undefined> = {};

  Object.entries(headers).forEach(([headerName, headerValue]) => {
    normalizedHeaders[headerName] = Array.isArray(headerValue)
      ? headerValue.join(", ")
      : headerValue;
  });

  return normalizedHeaders;
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseAllowedOrigins(value?: string): string[] {
  if (!value?.trim()) {
    return DEFAULT_STAGE_BROKER_ALLOWED_ORIGINS;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const runtimeConfig = createStageBrokerRuntimeConfig();

  startStageBrokerServer({
    runtimeConfig
  })
    .then(() => {
      console.log(`Blackstage broker listening on http://${runtimeConfig.host}:${runtimeConfig.port}`);
      console.log(`Realtime route: ${runtimeConfig.routePath}`);
      console.log("Live exchange remains disabled unless explicitly configured.");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
