import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  handleRealtimeUnifiedWebrtcBrokerRoute,
  type RealtimeBrokerOpenAiExchange,
  type RealtimeBrokerRouteEnvironment
} from "../../../packages/voice-core/dist/realtime/realtimeVoiceBrokerRoute.js";
import { BLACKSTAGE_REALTIME_BROKER_ROUTE } from "../../../packages/voice-core/dist/realtime/realtimeVoiceServerBroker.js";
import { createRealtimeVoiceSessionConfig } from "../../../packages/voice-core/dist/realtime/realtimeVoiceSession.js";

export { BLACKSTAGE_REALTIME_BROKER_ROUTE } from "../../../packages/voice-core/dist/realtime/realtimeVoiceServerBroker.js";

export const DEFAULT_STAGE_BROKER_HOST = "127.0.0.1";
export const DEFAULT_STAGE_BROKER_PORT = 8798;
export const STAGE_BROKER_LIVE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE";
export const STAGE_BROKER_SAFETY_ENV_VAR = "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER";

export type StageBrokerRuntimeConfig = {
  host: string;
  port: number;
  routePath: string;
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
    environment: {
      liveModeEnabled: env[STAGE_BROKER_LIVE_ENV_VAR] === "1",
      openAiApiKey: env.OPENAI_API_KEY,
      safetyIdentifier: env[STAGE_BROKER_SAFETY_ENV_VAR]
    }
  };
}

export function createStageBrokerServer(options: StageBrokerServerOptions = {}): Server {
  const runtimeConfig = resolveStageBrokerRuntimeConfig(options.runtimeConfig);

  return createServer((request, response) => {
    void handleStageBrokerRequest(request, response, runtimeConfig, options.exchangeWithOpenAi);
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

  response.writeHead(brokerResponse.status, brokerResponse.headers);
  response.end(brokerResponse.body);
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
