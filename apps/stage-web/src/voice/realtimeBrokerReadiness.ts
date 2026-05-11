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

export type StageWebRealtimeBrokerReadinessOptions = {
  routeUrl?: string;
  fetchImpl?: typeof fetch;
};

export function createDefaultStageWebBrokerReadiness(): RealtimeBrokerClientReadiness {
  return createRealtimeBrokerNotConfiguredReadiness();
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

export function createStageWebBrokerCheckingReadiness(
  routeUrl: string
): RealtimeBrokerClientReadiness {
  return createRealtimeBrokerCheckingReadiness(routeUrl);
}

function readStageWebBrokerEnvValue(): string | undefined {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  return meta.env?.[STAGE_WEB_REALTIME_BROKER_URL_ENV_VAR];
}
