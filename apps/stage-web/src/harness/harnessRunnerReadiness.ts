import {
  BLACKSTAGE_HARNESS_RUNNER_ROUTE,
  createHarnessRunnerCheckingReadiness,
  createHarnessRunnerNetworkErrorReadiness,
  createHarnessRunnerNotConfiguredReadiness,
  createHarnessRunnerReadinessProbe,
  interpretHarnessRunnerReadinessResponse,
  type HarnessRunnerClientReadiness
} from "@blackstage/agent-runtime";

export const STAGE_WEB_HARNESS_RUNNER_URL_ENV_VAR =
  "VITE_BLACKSTAGE_HARNESS_RUNNER_URL";

export type StageWebHarnessRunnerReadinessOptions = {
  routeUrl?: string;
  fetchImpl?: typeof fetch;
};

export type StageWebHarnessRunnerSnapshotStatus =
  | "not_configured"
  | "checking"
  | "loaded"
  | "unavailable";

export type StageWebHarnessRunnerSnapshot = {
  status: StageWebHarnessRunnerSnapshotStatus;
  routeUrl?: string;
  checkedAt: string;
  networkAttempted: boolean;
  openWorkCount?: number;
  reviewCount?: number;
  blockedCount?: number;
  totalTaskCount?: number;
  errors: string[];
};

export type StageWebHarnessRunnerProofsStatus =
  | "not_configured"
  | "checking"
  | "loaded"
  | "unavailable";

export type StageWebHarnessRunnerProofSummary = {
  taskId: string;
  runId: string;
  status: string;
  adapterId: string;
  proofPath: string;
  writtenAt: string;
};

export type StageWebHarnessRunnerProofs = {
  status: StageWebHarnessRunnerProofsStatus;
  routeUrl?: string;
  checkedAt: string;
  networkAttempted: boolean;
  proofCount?: number;
  latestProof?: StageWebHarnessRunnerProofSummary;
  errors: string[];
};

export function createDefaultStageWebHarnessReadiness(): HarnessRunnerClientReadiness {
  return createHarnessRunnerNotConfiguredReadiness();
}

export function createDefaultStageWebHarnessSnapshot(
  checkedAt = new Date().toISOString()
): StageWebHarnessRunnerSnapshot {
  return {
    status: "not_configured",
    checkedAt,
    networkAttempted: false,
    errors: []
  };
}

export function createStageWebHarnessSnapshotChecking(
  routeUrl: string,
  checkedAt = new Date().toISOString()
): StageWebHarnessRunnerSnapshot {
  return {
    status: "checking",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    errors: []
  };
}

export function createDefaultStageWebHarnessProofs(
  checkedAt = new Date().toISOString()
): StageWebHarnessRunnerProofs {
  return {
    status: "not_configured",
    checkedAt,
    networkAttempted: false,
    errors: []
  };
}

export function createStageWebHarnessProofsChecking(
  routeUrl: string,
  checkedAt = new Date().toISOString()
): StageWebHarnessRunnerProofs {
  return {
    status: "checking",
    routeUrl,
    checkedAt,
    networkAttempted: true,
    errors: []
  };
}

export function resolveStageWebHarnessRunnerRouteUrl(
  value = readStageWebHarnessEnvValue()
): string | undefined {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    const url = new URL(trimmedValue);

    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = BLACKSTAGE_HARNESS_RUNNER_ROUTE;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export function resolveStageWebHarnessRunnerSnapshotUrl(
  routeUrl: string | undefined
): string | undefined {
  if (!routeUrl) {
    return undefined;
  }

  try {
    const url = new URL(routeUrl);
    const normalizedPath = url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;

    url.pathname = `${normalizedPath}/snapshot`;

    return url.toString();
  } catch {
    return undefined;
  }
}

export function resolveStageWebHarnessRunnerProofsUrl(
  routeUrl: string | undefined
): string | undefined {
  if (!routeUrl) {
    return undefined;
  }

  try {
    const url = new URL(routeUrl);
    const normalizedPath = url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;

    url.pathname = `${normalizedPath}/proofs`;

    return url.toString();
  } catch {
    return undefined;
  }
}

export async function checkStageWebHarnessRunnerReadiness(
  options: StageWebHarnessRunnerReadinessOptions = {}
): Promise<HarnessRunnerClientReadiness> {
  const routeUrl = resolveStageWebHarnessRunnerRouteUrl(options.routeUrl);

  if (!routeUrl) {
    return createHarnessRunnerNotConfiguredReadiness();
  }

  const probe = createHarnessRunnerReadinessProbe(routeUrl);

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

    return interpretHarnessRunnerReadinessResponse({
      routeUrl,
      status: response.status,
      body
    });
  } catch (error) {
    return createHarnessRunnerNetworkErrorReadiness(routeUrl, error);
  }
}

export async function checkStageWebHarnessRunnerSnapshot(
  options: StageWebHarnessRunnerReadinessOptions = {}
): Promise<StageWebHarnessRunnerSnapshot> {
  const routeUrl = resolveStageWebHarnessRunnerSnapshotUrl(
    resolveStageWebHarnessRunnerRouteUrl(options.routeUrl)
  );

  if (!routeUrl) {
    return createDefaultStageWebHarnessSnapshot();
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

    return interpretStageWebHarnessRunnerSnapshot({
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
      errors: [error instanceof Error ? error.message : "Harness runner snapshot check failed."]
    };
  }
}

export async function checkStageWebHarnessRunnerProofs(
  options: StageWebHarnessRunnerReadinessOptions = {}
): Promise<StageWebHarnessRunnerProofs> {
  const routeUrl = resolveStageWebHarnessRunnerProofsUrl(
    resolveStageWebHarnessRunnerRouteUrl(options.routeUrl)
  );

  if (!routeUrl) {
    return createDefaultStageWebHarnessProofs();
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

    return interpretStageWebHarnessRunnerProofs({
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
      errors: [error instanceof Error ? error.message : "Harness runner proofs check failed."]
    };
  }
}

export function createStageWebHarnessCheckingReadiness(
  routeUrl: string
): HarnessRunnerClientReadiness {
  return createHarnessRunnerCheckingReadiness(routeUrl);
}

function interpretStageWebHarnessRunnerSnapshot(input: {
  routeUrl: string;
  status: number;
  body?: unknown;
  checkedAt?: string;
}): StageWebHarnessRunnerSnapshot {
  const checkedAt = input.checkedAt ?? new Date().toISOString();

  if (input.status !== 200 || !input.body || typeof input.body !== "object") {
    return {
      status: "unavailable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      errors: [`Harness runner snapshot check returned HTTP ${input.status}.`]
    };
  }

  const candidate = input.body as {
    controlPlane?: {
      openWorkCount?: unknown;
      reviewCount?: unknown;
      blockedCount?: unknown;
    };
    snapshot?: {
      tasks?: unknown;
    };
  };
  const openWorkCount = candidate.controlPlane?.openWorkCount;
  const reviewCount = candidate.controlPlane?.reviewCount;
  const blockedCount = candidate.controlPlane?.blockedCount;
  const tasks = candidate.snapshot?.tasks;

  if (
    typeof openWorkCount !== "number" ||
    typeof reviewCount !== "number" ||
    typeof blockedCount !== "number" ||
    !Array.isArray(tasks)
  ) {
    return {
      status: "unavailable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      errors: ["Harness runner snapshot body did not match the expected queue summary."]
    };
  }

  return {
    status: "loaded",
    routeUrl: input.routeUrl,
    checkedAt,
    networkAttempted: true,
    openWorkCount,
    reviewCount,
    blockedCount,
    totalTaskCount: tasks.length,
    errors: []
  };
}

function interpretStageWebHarnessRunnerProofs(input: {
  routeUrl: string;
  status: number;
  body?: unknown;
  checkedAt?: string;
}): StageWebHarnessRunnerProofs {
  const checkedAt = input.checkedAt ?? new Date().toISOString();

  if (input.status !== 200 || !input.body || typeof input.body !== "object") {
    return {
      status: "unavailable",
      routeUrl: input.routeUrl,
      checkedAt,
      networkAttempted: true,
      errors: [`Harness runner proofs check returned HTTP ${input.status}.`]
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
      errors: ["Harness runner proofs body did not match the expected proof summary list."]
    };
  }

  const proofs = candidate.proofs
    .map(parseStageWebHarnessProofSummary)
    .filter((proof): proof is StageWebHarnessRunnerProofSummary => proof !== undefined);

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

function parseStageWebHarnessProofSummary(
  proof: unknown
): StageWebHarnessRunnerProofSummary | undefined {
  if (!proof || typeof proof !== "object") {
    return undefined;
  }

  const candidate = proof as Partial<StageWebHarnessRunnerProofSummary>;

  if (
    typeof candidate.taskId !== "string" ||
    typeof candidate.runId !== "string" ||
    typeof candidate.status !== "string" ||
    typeof candidate.adapterId !== "string" ||
    typeof candidate.proofPath !== "string" ||
    typeof candidate.writtenAt !== "string"
  ) {
    return undefined;
  }

  return {
    taskId: candidate.taskId,
    runId: candidate.runId,
    status: candidate.status,
    adapterId: candidate.adapterId,
    proofPath: candidate.proofPath,
    writtenAt: candidate.writtenAt
  };
}

function readStageWebHarnessEnvValue(): string | undefined {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_HARNESS_RUNNER_URL_ENV_VAR];
}
