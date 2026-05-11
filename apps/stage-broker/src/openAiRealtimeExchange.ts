import type {
  RealtimeBrokerOpenAiExchange,
  RealtimeBrokerOpenAiExchangeResult
} from "../../../packages/voice-core/dist/realtime/realtimeVoiceBrokerRoute.js";

export const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export type StageBrokerFetch = typeof fetch;

export function createOpenAiRealtimeExchange(
  fetchImpl: StageBrokerFetch = fetch
): RealtimeBrokerOpenAiExchange {
  return async (openAiRequest, exchangeContext): Promise<RealtimeBrokerOpenAiExchangeResult> => {
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
      throw new Error(`OpenAI Realtime exchange failed with HTTP ${response.status}.`);
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
