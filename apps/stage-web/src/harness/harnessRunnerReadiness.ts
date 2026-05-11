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

export function createDefaultStageWebHarnessReadiness(): HarnessRunnerClientReadiness {
  return createHarnessRunnerNotConfiguredReadiness();
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

export function createStageWebHarnessCheckingReadiness(
  routeUrl: string
): HarnessRunnerClientReadiness {
  return createHarnessRunnerCheckingReadiness(routeUrl);
}

function readStageWebHarnessEnvValue(): string | undefined {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_HARNESS_RUNNER_URL_ENV_VAR];
}
