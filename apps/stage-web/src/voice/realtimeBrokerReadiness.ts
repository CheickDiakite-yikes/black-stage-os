import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
  createRealtimeBrokerCheckingReadiness,
  createRealtimeBrokerNetworkErrorReadiness,
  createRealtimeBrokerNotConfiguredReadiness,
  createRealtimeBrokerReadinessProbe,
  interpretRealtimeBrokerReadinessResponse,
  type RealtimeBrokerClientReadiness
} from "@blackstage/voice-core";

export const STAGE_WEB_REALTIME_BROKER_URL_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_BROKER_URL";
export const BLACKSTAGE_REALTIME_PROOFS_ROUTE = "/api/blackstage/realtime/proofs";

export type StageWebRealtimeBrokerReadinessOptions = {
  routeUrl?: string;
  fetchImpl?: typeof fetch;
};

export type StageWebRealtimeBrokerProofsStatus =
  | "not_configured"
  | "checking"
  | "loaded"
  | "unavailable";

export type StageWebRealtimeBrokerProofSummary = {
  status: "passed" | "failed" | "skipped";
  proofPath: string;
  createdAt: string;
  openAiNetworkCallAttempted: boolean;
  browserReceivesStandardApiKey: false;
  browserSendsAudio: boolean;
};

export type StageWebRealtimeBrokerProofs = {
  status: StageWebRealtimeBrokerProofsStatus;
  routeUrl?: string;
  checkedAt: string;
  networkAttempted: boolean;
  proofCount?: number;
  latestProof?: StageWebRealtimeBrokerProofSummary;
  errors: string[];
};

export function createDefaultStageWebBrokerReadiness(): RealtimeBrokerClientReadiness {
  return createRealtimeBrokerNotConfiguredReadiness();
}

export function createDefaultStageWebRealtimeBrokerProofs(
  checkedAt = new Date().toISOString()
): StageWebRealtimeBrokerProofs {
  return {
    status: "not_configured",
    checkedAt,
    networkAttempted: false,
    errors: []
  };
}

export function createStageWebRealtimeBrokerProofsChecking(
  routeUrl: string,
  checkedAt = new Date().toISOString()
): StageWebRealtimeBrokerProofs {
  return {
    status: "checking",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    errors: []
  };
}

export function resolveStageWebRealtimeBrokerRouteUrl(
  value = readStageWebBrokerEnvValue()
): string | undefined {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    const url = new URL(trimmedValue);

    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = BLACKSTAGE_REALTIME_BROKER_ROUTE;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export function resolveStageWebRealtimeBrokerProofsUrl(
  routeUrl: string | undefined
): string | undefined {
  if (!routeUrl) {
    return undefined;
  }

  try {
    const url = new URL(routeUrl);
    url.pathname = BLACKSTAGE_REALTIME_PROOFS_ROUTE;

    return url.toString();
  } catch {
    return undefined;
  }
}

export async function checkStageWebRealtimeBrokerReadiness(
  options: StageWebRealtimeBrokerReadinessOptions = {}
): Promise<RealtimeBrokerClientReadiness> {
  const routeUrl = resolveStageWebRealtimeBrokerRouteUrl(options.routeUrl);

  if (!routeUrl) {
    return createRealtimeBrokerNotConfiguredReadiness();
  }

  const probe = createRealtimeBrokerReadinessProbe(routeUrl);

  try {
    const response = await (options.fetchImpl ?? fetch)(routeUrl, {
      method: probe.method,
      headers: probe.headers,
      credentials: "omit"
    });
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    return interpretRealtimeBrokerReadinessResponse({
      routeUrl,
      status: response.status,
      body
    });
  } catch (error) {
    return createRealtimeBrokerNetworkErrorReadiness(routeUrl, error);
  }
}

export async function checkStageWebRealtimeBrokerProofs(
  options: StageWebRealtimeBrokerReadinessOptions = {}
): Promise<StageWebRealtimeBrokerProofs> {
  const routeUrl = resolveStageWebRealtimeBrokerProofsUrl(
    resolveStageWebRealtimeBrokerRouteUrl(options.routeUrl)
  );

  if (!routeUrl) {
    return createDefaultStageWebRealtimeBrokerProofs();
  }

  try {
    const response = await (options.fetchImpl ?? fetch)(routeUrl, {
      method: "GET",
      headers: {
        accept: "application/json"
      },
      credentials: "omit"
    });
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    return interpretStageWebRealtimeBrokerProofs({
      routeUrl,
      status: response.status,
      body
    });
  } catch (error) {
    return {
      status: "unavailable",
      routeUrl,
      checkedAt: new Date().toISOString(),
      networkAttempted: true,
      errors: [
        error instanceof Error ? error.message : "Realtime broker proofs check failed."
      ]
    };
  }
}

export function createStageWebBrokerCheckingReadiness(
  routeUrl: string
): RealtimeBrokerClientReadiness {
  return createRealtimeBrokerCheckingReadiness(routeUrl);
}

function interpretStageWebRealtimeBrokerProofs(input: {
  routeUrl: string;
  status: number;
  body?: unknown;
  checkedAt?: string;
}): StageWebRealtimeBrokerProofs {
  const checkedAt = input.checkedAt ?? new Date().toISOString();

  if (input.status !== 200 || !input.body || typeof input.body !== "object") {
    return {
      status: "unavailable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      errors: [`Realtime broker proofs check returned HTTP ${input.status}.`]
    };
  }

  const candidate = input.body as {
    proofs?: unknown;
  };

  if (!Array.isArray(candidate.proofs)) {
    return {
      status: "unavailable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      errors: [
        "Realtime broker proofs body did not match the expected proof summary list."
      ]
    };
  }

  const proofs = candidate.proofs
    .map(parseStageWebRealtimeProofSummary)
    .filter(
      (proof): proof is StageWebRealtimeBrokerProofSummary => proof !== undefined
    );

  return {
    status: "loaded",
    routeUrl: input.routeUrl,
    checkedAt,
    networkAttempted: true,
    proofCount: proofs.length,
    latestProof: proofs[0],
    errors: []
  };
}

function parseStageWebRealtimeProofSummary(
  proof: unknown
): StageWebRealtimeBrokerProofSummary | undefined {
  if (!proof || typeof proof !== "object") {
    return undefined;
  }

  const candidate = proof as Partial<StageWebRealtimeBrokerProofSummary>;

  if (
    !isRealtimeProofStatus(candidate.status) ||
    typeof candidate.proofPath !== "string" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.openAiNetworkCallAttempted !== "boolean" ||
    candidate.browserReceivesStandardApiKey !== false ||
    typeof candidate.browserSendsAudio !== "boolean"
  ) {
    return undefined;
  }

  return {
    status: candidate.status,
    proofPath: candidate.proofPath,
    createdAt: candidate.createdAt,
    openAiNetworkCallAttempted: candidate.openAiNetworkCallAttempted,
    browserReceivesStandardApiKey: false,
    browserSendsAudio: candidate.browserSendsAudio
  };
}

function isRealtimeProofStatus(
  status: unknown
): status is StageWebRealtimeBrokerProofSummary["status"] {
  return status === "passed" || status === "failed" || status === "skipped";
}

function readStageWebBrokerEnvValue(): string | undefined {
  const runtimeConfig = globalThis as typeof globalThis & {
    __blackstageRealtimeBrokerUrl?: string;
  };

  if (runtimeConfig.__blackstageRealtimeBrokerUrl) {
    return runtimeConfig.__blackstageRealtimeBrokerUrl;
  }

  try {
    const localRouteUrl = localStorage.getItem("blackstage.realtimeBroker.url");

    if (localRouteUrl) {
      return localRouteUrl;
    }
  } catch {
    // Local runtime config is best-effort; Vite env remains the durable path.
  }

  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_REALTIME_BROKER_URL_ENV_VAR];
}
