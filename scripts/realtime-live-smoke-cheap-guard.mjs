export const REALTIME_LIVE_SMOKE_TIMEOUT_ENV_VAR =
  "BLACKSTAGE_REALTIME_LIVE_SMOKE_TIMEOUT_MS";
export const REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS = 15_000;
export const DEFAULT_REALTIME_LIVE_SMOKE_TIMEOUT_MS = 30_000;
export const REALTIME_LIVE_SMOKE_MAX_PROVIDER_REQUESTS = 1;

export function createRealtimeLiveSmokeCheapGuard({
  env = process.env,
  offerSdp
} = {}) {
  const offer =
    offerSdp === undefined ? undefined : summarizeRealtimeOfferSdp(offerSdp);

  return compactObject({
    browserSendsAudio: false,
    browserReceivesStandardApiKey: false,
    liveFlagMustBeShellExport: true,
    liveCallRequiresExplicitArm: true,
    offerMode: "data_channel_only",
    dataChannelOnly: true,
    rejectsAudioSdp: true,
    maxProviderRequests: REALTIME_LIVE_SMOKE_MAX_PROVIDER_REQUESTS,
    timeoutCapMs: REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS,
    effectiveTimeoutMs: readRealtimeLiveSmokeTimeoutMs(env),
    offer
  });
}

export function readRealtimeLiveSmokeTimeoutMs(env = process.env) {
  const rawTimeoutMs = env[REALTIME_LIVE_SMOKE_TIMEOUT_ENV_VAR];
  const parsedTimeoutMs = rawTimeoutMs ? Number(rawTimeoutMs) : NaN;
  const requestedTimeoutMs =
    Number.isFinite(parsedTimeoutMs) && parsedTimeoutMs > 0
      ? parsedTimeoutMs
      : DEFAULT_REALTIME_LIVE_SMOKE_TIMEOUT_MS;

  return Math.min(requestedTimeoutMs, REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS);
}

export function assertRealtimeLiveSmokeOfferIsCheap(offerSdp) {
  const summary = summarizeRealtimeOfferSdp(offerSdp);

  if (summary.hasAudioMediaSection) {
    throw new Error(
      "Realtime live-smoke cheap guard rejected an SDP offer with audio media."
    );
  }

  if (!summary.hasDataChannelMediaSection) {
    throw new Error(
      "Realtime live-smoke cheap guard requires a data-channel-only SDP offer."
    );
  }

  return summary;
}

export function summarizeRealtimeOfferSdp(offerSdp) {
  const sdp = String(offerSdp ?? "");

  return {
    byteLength: Buffer.byteLength(sdp, "utf8"),
    hasAudioMediaSection: hasSdpMediaLine(sdp, "audio"),
    hasDataChannelMediaSection: hasSdpMediaLine(sdp, "application"),
    hasVideoMediaSection: hasSdpMediaLine(sdp, "video")
  };
}

function hasSdpMediaLine(sdp, mediaKind) {
  return new RegExp(`(?:^|\\r?\\n)m=${mediaKind}\\b`, "i").test(sdp);
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}
