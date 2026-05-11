export type RealtimeBrokerReadinessStatus =
  | "not_configured"
  | "checking"
  | "reachable"
  | "unreachable";

export const BLACKSTAGE_REALTIME_APPROVAL_HEADER = "x-blackstage-realtime-approval";

export type RealtimeBrokerReadinessProbe = {
  method: "GET";
  routeUrl?: string;
  headers: {
    accept: "application/json";
  };
  browserSendsAudio: false;
  browserSendsSdp: false;
  browserReceivesStandardApiKey: false;
};

export type RealtimeBrokerReadinessBody = {
  ok: true;
  route: string;
  liveModeEnabled: boolean;
  accepts: "application/sdp";
  browserSendsAudio: false;
  browserReceivesStandardApiKey: false;
  checkedAt: string;
};

export type RealtimeBrokerClientReadiness = {
  status: RealtimeBrokerReadinessStatus;
  routeUrl?: string;
  checkedAt: string;
  networkAttempted: boolean;
  liveModeEnabled?: boolean;
  browserSendsAudio: false;
  browserSendsSdp: false;
  browserReceivesStandardApiKey: false;
  errors: string[];
};

export function createRealtimeBrokerReadinessProbe(
  routeUrl?: string
): RealtimeBrokerReadinessProbe {
  return {
    method: "GET",
    routeUrl,
    headers: {
      accept: "application/json"
    },
    browserSendsAudio: false,
    browserSendsSdp: false,
    browserReceivesStandardApiKey: false
  };
}

export function createRealtimeBrokerNotConfiguredReadiness(
  checkedAt = new Date().toISOString()
): RealtimeBrokerClientReadiness {
  return {
    status: "not_configured",
    checkedAt,
    networkAttempted: false,
    browserSendsAudio: false,
    browserSendsSdp: false,
    browserReceivesStandardApiKey: false,
    errors: []
  };
}

export function createRealtimeBrokerCheckingReadiness(
  routeUrl: string,
  checkedAt = new Date().toISOString()
): RealtimeBrokerClientReadiness {
  return {
    status: "checking",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    browserSendsAudio: false,
    browserSendsSdp: false,
    browserReceivesStandardApiKey: false,
    errors: []
  };
}

export function createRealtimeBrokerNetworkErrorReadiness(
  routeUrl: string,
  error: unknown,
  checkedAt = new Date().toISOString()
): RealtimeBrokerClientReadiness {
  return {
    status: "unreachable",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    browserSendsAudio: false,
    browserSendsSdp: false,
    browserReceivesStandardApiKey: false,
    errors: [error instanceof Error ? error.message : "Realtime broker readiness check failed."]
  };
}

export function interpretRealtimeBrokerReadinessResponse(input: {
  routeUrl: string;
  status: number;
  body?: unknown;
  checkedAt?: string;
}): RealtimeBrokerClientReadiness {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const body = parseRealtimeBrokerReadinessBody(input.body);

  if (input.status === 200 && body) {
    return {
      status: "reachable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      liveModeEnabled: body.liveModeEnabled,
      browserSendsAudio: false,
      browserSendsSdp: false,
      browserReceivesStandardApiKey: body.browserReceivesStandardApiKey,
      errors: []
    };
  }

  return {
    status: "unreachable",
    routeUrl: input.routeUrl,
    checkedAt,
    networkAttempted: true,
    browserSendsAudio: false,
    browserSendsSdp: false,
    browserReceivesStandardApiKey: false,
    errors: [`Realtime broker readiness check returned HTTP ${input.status}.`]
  };
}

function parseRealtimeBrokerReadinessBody(
  body: unknown
): RealtimeBrokerReadinessBody | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const candidate = body as Partial<RealtimeBrokerReadinessBody>;

  if (
    candidate.ok !== true ||
    typeof candidate.route !== "string" ||
    typeof candidate.liveModeEnabled !== "boolean" ||
    candidate.accepts !== "application/sdp" ||
    candidate.browserSendsAudio !== false ||
    candidate.browserReceivesStandardApiKey !== false ||
    typeof candidate.checkedAt !== "string"
  ) {
    return undefined;
  }

  return {
    ok: true,
    route: candidate.route,
    liveModeEnabled: candidate.liveModeEnabled,
    accepts: "application/sdp",
    browserSendsAudio: false,
    browserReceivesStandardApiKey: false,
    checkedAt: candidate.checkedAt
  };
}
