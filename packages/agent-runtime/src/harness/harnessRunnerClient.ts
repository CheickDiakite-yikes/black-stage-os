export const BLACKSTAGE_HARNESS_RUNNER_ROUTE = "/api/blackstage/harness";

export type HarnessRunnerReadinessStatus =
  | "not_configured"
  | "checking"
  | "reachable"
  | "unreachable";

export type HarnessRunnerReadinessProbe = {
  method: "GET";
  routeUrl?: string;
  headers: {
    accept: "application/json";
  };
  browserCanEnqueueWork: false;
  browserCanRunCodex: false;
  browserReceivesProviderCredentials: false;
};

export type HarnessRunnerReadinessBody = {
  ok: true;
  route: string;
  orchestration: "symphony_style_internal_queue";
  codexMode: "dry_run" | "local_exec" | "disabled";
  agentsSdkMode: "dry_run" | "disabled";
  localCodexSubprocessEnabled: boolean;
  browserCanEnqueueWork: false;
  browserCanRunCodex: false;
  browserReceivesProviderCredentials: false;
  checkedAt: string;
};

export type HarnessRunnerClientReadiness = {
  status: HarnessRunnerReadinessStatus;
  routeUrl?: string;
  checkedAt: string;
  networkAttempted: boolean;
  orchestration?: HarnessRunnerReadinessBody["orchestration"];
  codexMode?: HarnessRunnerReadinessBody["codexMode"];
  agentsSdkMode?: HarnessRunnerReadinessBody["agentsSdkMode"];
  localCodexSubprocessEnabled: boolean;
  browserCanEnqueueWork: false;
  browserCanRunCodex: false;
  browserReceivesProviderCredentials: false;
  errors: string[];
};

export function createHarnessRunnerReadinessProbe(
  routeUrl?: string
): HarnessRunnerReadinessProbe {
  return {
    method: "GET",
    routeUrl,
    headers: {
      accept: "application/json"
    },
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false
  };
}

export function createHarnessRunnerNotConfiguredReadiness(
  checkedAt = new Date().toISOString()
): HarnessRunnerClientReadiness {
  return {
    status: "not_configured",
    checkedAt,
    networkAttempted: false,
    localCodexSubprocessEnabled: false,
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    errors: []
  };
}

export function createHarnessRunnerCheckingReadiness(
  routeUrl: string,
  checkedAt = new Date().toISOString()
): HarnessRunnerClientReadiness {
  return {
    status: "checking",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    localCodexSubprocessEnabled: false,
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    errors: []
  };
}

export function createHarnessRunnerNetworkErrorReadiness(
  routeUrl: string,
  error: unknown,
  checkedAt = new Date().toISOString()
): HarnessRunnerClientReadiness {
  return {
    status: "unreachable",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    localCodexSubprocessEnabled: false,
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    errors: [error instanceof Error ? error.message : "Harness runner readiness check failed."]
  };
}

export function interpretHarnessRunnerReadinessResponse(input: {
  routeUrl: string;
  status: number;
  body?: unknown;
  checkedAt?: string;
}): HarnessRunnerClientReadiness {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const body = parseHarnessRunnerReadinessBody(input.body);

  if (input.status === 200 && body) {
    return {
      status: "reachable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      orchestration: body.orchestration,
      codexMode: body.codexMode,
      agentsSdkMode: body.agentsSdkMode,
      localCodexSubprocessEnabled: body.localCodexSubprocessEnabled,
      browserCanEnqueueWork: body.browserCanEnqueueWork,
      browserCanRunCodex: body.browserCanRunCodex,
      browserReceivesProviderCredentials: body.browserReceivesProviderCredentials,
      errors: []
    };
  }

  return {
    status: "unreachable",
    routeUrl: input.routeUrl,
    checkedAt,
    networkAttempted: true,
    localCodexSubprocessEnabled: false,
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    errors: [`Harness runner readiness check returned HTTP ${input.status}.`]
  };
}

function parseHarnessRunnerReadinessBody(
  body: unknown
): HarnessRunnerReadinessBody | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const candidate = body as Partial<HarnessRunnerReadinessBody>;

  if (
    candidate.ok !== true ||
    typeof candidate.route !== "string" ||
    candidate.orchestration !== "symphony_style_internal_queue" ||
    !isHarnessRunnerCodexMode(candidate.codexMode) ||
    !isHarnessRunnerAgentsSdkMode(candidate.agentsSdkMode) ||
    typeof candidate.localCodexSubprocessEnabled !== "boolean" ||
    candidate.browserCanEnqueueWork !== false ||
    candidate.browserCanRunCodex !== false ||
    candidate.browserReceivesProviderCredentials !== false ||
    typeof candidate.checkedAt !== "string"
  ) {
    return undefined;
  }

  return {
    ok: true,
    route: candidate.route,
    orchestration: "symphony_style_internal_queue",
    codexMode: candidate.codexMode,
    agentsSdkMode: candidate.agentsSdkMode,
    localCodexSubprocessEnabled: candidate.localCodexSubprocessEnabled,
    browserCanEnqueueWork: false,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    checkedAt: candidate.checkedAt
  };
}

function isHarnessRunnerCodexMode(
  value: unknown
): value is HarnessRunnerReadinessBody["codexMode"] {
  return value === "dry_run" || value === "local_exec" || value === "disabled";
}

function isHarnessRunnerAgentsSdkMode(
  value: unknown
): value is HarnessRunnerReadinessBody["agentsSdkMode"] {
  return value === "dry_run" || value === "disabled";
}
