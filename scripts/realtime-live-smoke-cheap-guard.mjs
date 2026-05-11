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
    offerMode: "data_channel_plus_recvonly_audio",
    requiresAudioMediaSection: true,
    rejectsBrowserAudioSend: true,
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

  if (!summary.hasAudioMediaSection) {
    throw new Error(
      "Realtime live-smoke cheap guard requires a recvonly audio media section."
    );
  }

  if (summary.hasAudioSendMediaSection) {
    throw new Error(
      "Realtime live-smoke cheap guard rejected an SDP offer that can send browser audio."
    );
  }

  if (!summary.hasDataChannelMediaSection) {
    throw new Error("Realtime live-smoke cheap guard requires an events data channel.");
  }

  return summary;
}

export function summarizeRealtimeOfferSdp(offerSdp) {
  const sdp = String(offerSdp ?? "");
  const audioDirections = readSdpMediaDirections(sdp, "audio");

  return {
    byteLength: Buffer.byteLength(sdp, "utf8"),
    audioDirections,
    hasAudioMediaSection: hasSdpMediaLine(sdp, "audio"),
    hasAudioSendMediaSection: audioDirections.some(
      (direction) => direction === "sendonly" || direction === "sendrecv"
    ),
    hasDataChannelMediaSection: hasSdpMediaLine(sdp, "application"),
    hasVideoMediaSection: hasSdpMediaLine(sdp, "video")
  };
}

function readSdpMediaDirections(sdp, mediaKind) {
  return readSdpMediaSections(sdp, mediaKind).map((section) => {
    if (/(?:^|\r?\n)a=sendonly(?:\r?\n|$)/i.test(section)) {
      return "sendonly";
    }

    if (/(?:^|\r?\n)a=recvonly(?:\r?\n|$)/i.test(section)) {
      return "recvonly";
    }

    if (/(?:^|\r?\n)a=inactive(?:\r?\n|$)/i.test(section)) {
      return "inactive";
    }

    return "sendrecv";
  });
}

function readSdpMediaSections(sdp, mediaKind) {
  return String(sdp ?? "")
    .split(/\r?\n(?=m=)/)
    .filter((section) => new RegExp(`^m=${mediaKind}\\b`, "i").test(section));
}

function hasSdpMediaLine(sdp, mediaKind) {
  return new RegExp(`(?:^|\\r?\\n)m=${mediaKind}\\b`, "i").test(sdp);
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}
