import type {
  RealtimeBrokerOpenAiExchangeError,
  RealtimeBrokerOpenAiExchange,
  RealtimeBrokerOpenAiExchangeResult
} from "../../../packages/voice-core/dist/realtime/realtimeVoiceBrokerRoute.js";

export const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export type StageBrokerFetch = typeof fetch;

export function createOpenAiRealtimeExchange(
  fetchImpl: StageBrokerFetch = fetch
): RealtimeBrokerOpenAiExchange {
  return async (
    openAiRequest,
    exchangeContext
  ): Promise<RealtimeBrokerOpenAiExchangeResult> => {
    const formData = new FormData();
    formData.set("sdp", openAiRequest.body.sdp);
    formData.set("session", JSON.stringify(openAiRequest.body.session));

    const response = await fetchImpl(OPENAI_REALTIME_CALLS_URL, {
      method: openAiRequest.method,
      headers: {
        authorization: `Bearer ${exchangeContext.apiKey}`,
        "openai-safety-identifier": openAiRequest.safetyIdentifier
      },
      body: formData
    });
    const answerSdp = await response.text();

    if (!response.ok) {
      const error = new Error(
        `OpenAI Realtime exchange failed with HTTP ${response.status}.`
      ) as RealtimeBrokerOpenAiExchangeError;
      error.upstreamStatus = response.status;

      const requestId = readSafeResponseHeaders(response.headers)[
        "x-openai-request-id"
      ];

      if (requestId) {
        error.upstreamRequestId = requestId;
      }

      error.upstreamError = readSafeUpstreamError(answerSdp);

      throw error;
    }

    return {
      answerSdp,
      responseHeaders: readSafeResponseHeaders(response.headers)
    };
  };
}

function readSafeResponseHeaders(headers: Headers): Record<string, string> {
  const safeHeaders: Record<string, string> = {};
  const requestId = headers.get("x-request-id") ?? headers.get("x-openai-request-id");

  if (requestId) {
    safeHeaders["x-openai-request-id"] = requestId;
  }

  return safeHeaders;
}

function readSafeUpstreamError(
  responseBody: string
): NonNullable<RealtimeBrokerOpenAiExchangeError["upstreamError"]> | undefined {
  const trimmedBody = responseBody.trim();

  if (!trimmedBody) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmedBody) as {
      error?: {
        code?: unknown;
        message?: unknown;
        param?: unknown;
        type?: unknown;
      };
    };
    const error = parsed.error;

    if (!error) {
      return {
        message: sanitizeUpstreamText(trimmedBody)
      };
    }

    return {
      code: sanitizeOptionalUpstreamText(error.code),
      message: sanitizeOptionalUpstreamText(error.message),
      param: sanitizeOptionalUpstreamText(error.param),
      type: sanitizeOptionalUpstreamText(error.type)
    };
  } catch {
    return {
      message: sanitizeUpstreamText(trimmedBody)
    };
  }
}

function sanitizeOptionalUpstreamText(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return sanitizeUpstreamText(value);
}

function sanitizeUpstreamText(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted-key]")
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]")
    .replace(/(?:^|\n)\s*(?:v|o|s|t|m|a|c)=.*$/gim, "[redacted-sdp]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}
