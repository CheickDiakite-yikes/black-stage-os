import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
  OPENAI_API_KEY_ENV_VAR,
  createRealtimeUnifiedWebrtcBrokerRequest,
  type RealtimeUnifiedWebrtcOpenAiRequest
} from "./realtimeVoiceServerBroker.js";
import type { RealtimeVoiceSessionConfig } from "./realtimeVoiceSession.js";

export type RealtimeBrokerRouteHttpRequest = {
  method: string;
  path: string;
  headers?: Record<string, string | undefined>;
  body?: string;
  requestedAt: string;
};

export type RealtimeBrokerRouteEnvironment = {
  liveModeEnabled?: boolean;
  openAiApiKey?: string;
  safetyIdentifier?: string;
};

export type RealtimeBrokerOpenAiExchangeContext = {
  apiKey: string;
};

export type RealtimeBrokerOpenAiExchangeResult = {
  answerSdp: string;
  responseHeaders?: Record<string, string>;
};

export type RealtimeBrokerOpenAiExchangeError = Error & {
  upstreamStatus?: number;
  upstreamRequestId?: string;
  upstreamError?: {
    code?: string;
    message?: string;
    param?: string;
    type?: string;
  };
};

export type RealtimeBrokerOpenAiExchange = (
  request: RealtimeUnifiedWebrtcOpenAiRequest,
  context: RealtimeBrokerOpenAiExchangeContext
) => Promise<RealtimeBrokerOpenAiExchangeResult>;

export type RealtimeBrokerRouteContext = {
  config: RealtimeVoiceSessionConfig;
  environment?: RealtimeBrokerRouteEnvironment;
  serverRoute?: string;
  exchangeWithOpenAi?: RealtimeBrokerOpenAiExchange;
};

export type RealtimeBrokerRouteResponse = {
  status: 200 | 400 | 404 | 405 | 415 | 501 | 503;
  headers: Record<string, string>;
  body: string;
  networkAttempted: boolean;
};

export async function handleRealtimeUnifiedWebrtcBrokerRoute(
  request: RealtimeBrokerRouteHttpRequest,
  context: RealtimeBrokerRouteContext
): Promise<RealtimeBrokerRouteResponse> {
  const routePath = context.serverRoute ?? BLACKSTAGE_REALTIME_BROKER_ROUTE;

  if (request.path !== routePath) {
    return jsonResponse(404, request, ["Realtime broker route not found."], false);
  }

  if (request.method.toUpperCase() !== "POST") {
    return jsonResponse(405, request, ["Realtime broker accepts POST only."], false, {
      allow: "POST"
    });
  }

  if (!contentTypeAllowsSdp(request.headers)) {
    return jsonResponse(
      415,
      request,
      ["Realtime broker requires application/sdp."],
      false
    );
  }

  if (!request.body?.trim()) {
    return jsonResponse(400, request, ["Browser SDP offer is required."], false);
  }

  const environment = context.environment ?? {};
  const brokerRequest = createRealtimeUnifiedWebrtcBrokerRequest(context.config, {
    requestedAt: request.requestedAt,
    safetyIdentifier: environment.safetyIdentifier,
    clientSdpOffer: request.body,
    liveModeEnabled: environment.liveModeEnabled,
    standardApiKeyAvailable: Boolean(environment.openAiApiKey),
    serverRoute: routePath
  });

  if (!brokerRequest.enabled) {
    return jsonResponse(503, request, brokerRequest.blockedReasons, false);
  }

  if (!environment.openAiApiKey) {
    return jsonResponse(
      503,
      request,
      [`Server is missing ${OPENAI_API_KEY_ENV_VAR}.`],
      false
    );
  }

  if (!context.exchangeWithOpenAi) {
    return jsonResponse(
      501,
      request,
      [
        "Realtime broker route is configured, but no OpenAI exchange handler is installed."
      ],
      false
    );
  }

  let exchangeResult: RealtimeBrokerOpenAiExchangeResult;

  try {
    exchangeResult = await context.exchangeWithOpenAi(brokerRequest.openAiRequest, {
      apiKey: environment.openAiApiKey
    });
  } catch (error) {
    return jsonResponse(503, request, createSafeExchangeFailureMessages(error), true);
  }

  return {
    status: 200,
    headers: {
      "content-type": "application/sdp",
      ...redactResponseHeaders(exchangeResult.responseHeaders)
    },
    body: exchangeResult.answerSdp,
    networkAttempted: true
  };
}

function contentTypeAllowsSdp(
  headers: Record<string, string | undefined> = {}
): boolean {
  const contentType = findHeader(headers, "content-type");

  return contentType?.toLowerCase().split(";")[0]?.trim() === "application/sdp";
}

function findHeader(
  headers: Record<string, string | undefined>,
  targetName: string
): string | undefined {
  const normalizedTarget = targetName.toLowerCase();
  const entry = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === normalizedTarget
  );

  return entry?.[1];
}

function createSafeExchangeFailureMessages(error: unknown): string[] {
  const messages = ["Realtime broker exchange failed before returning an SDP answer."];
  const exchangeError = isRealtimeBrokerOpenAiExchangeError(error) ? error : undefined;
  const upstreamStatus = exchangeError?.upstreamStatus;

  if (Number.isInteger(upstreamStatus)) {
    messages.push(`OpenAI Realtime upstream returned HTTP ${upstreamStatus}.`);
  }

  if (exchangeError?.upstreamRequestId) {
    messages.push(`OpenAI request id: ${exchangeError.upstreamRequestId}.`);
  }

  const upstreamError = formatSafeUpstreamError(exchangeError?.upstreamError);

  if (upstreamError) {
    messages.push(`OpenAI Realtime upstream error: ${upstreamError}.`);
  }

  return messages;
}

function isRealtimeBrokerOpenAiExchangeError(
  error: unknown
): error is RealtimeBrokerOpenAiExchangeError {
  return typeof error === "object" && error !== null;
}

function formatSafeUpstreamError(
  upstreamError: RealtimeBrokerOpenAiExchangeError["upstreamError"] | undefined
): string | undefined {
  if (!upstreamError) {
    return undefined;
  }

  return [
    upstreamError.type ? `type=${upstreamError.type}` : undefined,
    upstreamError.code ? `code=${upstreamError.code}` : undefined,
    upstreamError.param ? `param=${upstreamError.param}` : undefined,
    upstreamError.message ? `message=${upstreamError.message}` : undefined
  ]
    .filter(Boolean)
    .join(" · ");
}

function jsonResponse(
  status: RealtimeBrokerRouteResponse["status"],
  request: RealtimeBrokerRouteHttpRequest,
  errors: string[],
  networkAttempted: boolean,
  extraHeaders: Record<string, string> = {}
): RealtimeBrokerRouteResponse {
  return {
    status,
    headers: {
      "content-type": "application/json",
      ...extraHeaders
    },
    body: JSON.stringify({
      ok: false,
      requestedAt: request.requestedAt,
      errors
    }),
    networkAttempted
  };
}

function redactResponseHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([headerName]) => headerName.toLowerCase() !== "authorization"
    )
  );
}
