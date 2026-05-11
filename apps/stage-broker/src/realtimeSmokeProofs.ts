import { readdir, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

export const DEFAULT_REALTIME_SMOKE_PROOF_ROOT = ".blackstage/realtime-smoke";
export const REALTIME_SMOKE_PROOF_KIND = "blackstage.realtime.live_smoke";

export type RealtimeSmokeProofStatus = "passed" | "failed" | "skipped";

export type RealtimeSmokeProofSummary = {
  proofVersion: 1;
  kind: typeof REALTIME_SMOKE_PROOF_KIND;
  status: RealtimeSmokeProofStatus;
  proofPath: string;
  createdAt: string;
  route?: string;
  liveSmokeArmed: boolean;
  openAiNetworkCallAttempted: boolean;
  browserReceivesStandardApiKey: false;
  browserSendsAudio: boolean;
  offerBytes?: number;
  answerBytes?: number;
  answerSha256Prefix?: string;
  cheapTestGuard?: RealtimeSmokeProofCheapGuardSummary;
  missingEnv: string[];
};

export type RealtimeSmokeProofAudioDirection =
  | "inactive"
  | "recvonly"
  | "sendonly"
  | "sendrecv";

export type RealtimeSmokeProofCheapGuardSummary = {
  offerMode?: "data_channel_plus_recvonly_audio";
  rejectsBrowserAudioSend?: true;
  maxProviderRequests?: number;
  effectiveTimeoutMs?: number;
  offer?: {
    audioDirections?: RealtimeSmokeProofAudioDirection[];
    hasAudioSendMediaSection?: false;
    hasDataChannelMediaSection?: true;
  };
};

export type RealtimeSmokeProofIndexOptions = {
  repoRoot?: string;
  proofRoot?: string;
};

export async function readRealtimeSmokeProofIndex(
  options: RealtimeSmokeProofIndexOptions = {}
): Promise<RealtimeSmokeProofSummary[]> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const proofRoot = options.proofRoot ?? DEFAULT_REALTIME_SMOKE_PROOF_ROOT;
  const absoluteProofRoot = resolveProofRoot(repoRoot, proofRoot);
  let entries;

  try {
    entries = await readdir(absoluteProofRoot, {
      withFileTypes: true
    });
  } catch (error) {
    if (isNoEntryError(error)) {
      return [];
    }

    throw error;
  }

  const proofs = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const proofPath = `${proofRoot.replace(/\/+$/, "")}/${entry.name}`;
        const absoluteProofPath = join(absoluteProofRoot, entry.name);

        try {
          return parseRealtimeSmokeProofSummary(
            await readFile(absoluteProofPath, "utf8"),
            proofPath
          );
        } catch {
          return undefined;
        }
      })
  );

  return proofs
    .filter((proof): proof is RealtimeSmokeProofSummary => proof !== undefined)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function parseRealtimeSmokeProofSummary(
  rawProof: string,
  proofPath: string
): RealtimeSmokeProofSummary | undefined {
  const candidate = JSON.parse(rawProof) as Partial<RealtimeSmokeProofSummary>;

  if (
    candidate.proofVersion !== 1 ||
    candidate.kind !== REALTIME_SMOKE_PROOF_KIND ||
    !isRealtimeSmokeProofStatus(candidate.status) ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.liveSmokeArmed !== "boolean" ||
    typeof candidate.openAiNetworkCallAttempted !== "boolean" ||
    candidate.browserReceivesStandardApiKey !== false ||
    typeof candidate.browserSendsAudio !== "boolean" ||
    !Array.isArray(candidate.missingEnv)
  ) {
    return undefined;
  }

  return {
    proofVersion: 1,
    kind: REALTIME_SMOKE_PROOF_KIND,
    status: candidate.status,
    proofPath,
    createdAt: candidate.createdAt,
    route: typeof candidate.route === "string" ? candidate.route : undefined,
    liveSmokeArmed: candidate.liveSmokeArmed,
    openAiNetworkCallAttempted: candidate.openAiNetworkCallAttempted,
    browserReceivesStandardApiKey: false,
    browserSendsAudio: candidate.browserSendsAudio,
    offerBytes: normalizeOptionalNumber(candidate.offerBytes),
    answerBytes: normalizeOptionalNumber(candidate.answerBytes),
    answerSha256Prefix:
      typeof candidate.answerSha256Prefix === "string"
        ? candidate.answerSha256Prefix
        : undefined,
    cheapTestGuard: parseCheapTestGuard(candidate.cheapTestGuard),
    missingEnv: candidate.missingEnv.filter(
      (envVar): envVar is string => typeof envVar === "string"
    )
  };
}

function parseCheapTestGuard(
  value: unknown
): RealtimeSmokeProofCheapGuardSummary | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as {
    effectiveTimeoutMs?: unknown;
    maxProviderRequests?: unknown;
    offer?: unknown;
    offerMode?: unknown;
    rejectsBrowserAudioSend?: unknown;
  };
  const offer = parseCheapTestGuardOffer(candidate.offer);
  const summary: RealtimeSmokeProofCheapGuardSummary = {
    offerMode:
      candidate.offerMode === "data_channel_plus_recvonly_audio"
        ? "data_channel_plus_recvonly_audio"
        : undefined,
    rejectsBrowserAudioSend:
      candidate.rejectsBrowserAudioSend === true ? true : undefined,
    maxProviderRequests: normalizeOptionalNumber(candidate.maxProviderRequests),
    effectiveTimeoutMs: normalizeOptionalNumber(candidate.effectiveTimeoutMs),
    offer
  };

  return hasDefinedSummaryValue(summary) ? summary : undefined;
}

function parseCheapTestGuardOffer(
  value: unknown
): RealtimeSmokeProofCheapGuardSummary["offer"] | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as {
    audioDirections?: unknown;
    hasAudioSendMediaSection?: unknown;
    hasDataChannelMediaSection?: unknown;
  };
  const offer: NonNullable<RealtimeSmokeProofCheapGuardSummary["offer"]> = {
    audioDirections: normalizeAudioDirections(candidate.audioDirections),
    hasAudioSendMediaSection:
      candidate.hasAudioSendMediaSection === false ? false : undefined,
    hasDataChannelMediaSection:
      candidate.hasDataChannelMediaSection === true ? true : undefined
  };

  return hasDefinedSummaryValue(offer) ? offer : undefined;
}

function resolveProofRoot(repoRoot: string, proofRoot: string): string {
  const absoluteBlackstageRoot = resolve(repoRoot, ".blackstage");
  const absoluteProofRoot = resolve(repoRoot, proofRoot);

  if (
    absoluteProofRoot !== absoluteBlackstageRoot &&
    !absoluteProofRoot.startsWith(`${absoluteBlackstageRoot}${sep}`)
  ) {
    throw new Error("Realtime smoke proof root must stay inside .blackstage/.");
  }

  return absoluteProofRoot;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function normalizeAudioDirections(
  value: unknown
): RealtimeSmokeProofAudioDirection[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const directions = value.filter(
    (direction): direction is RealtimeSmokeProofAudioDirection =>
      direction === "inactive" ||
      direction === "recvonly" ||
      direction === "sendonly" ||
      direction === "sendrecv"
  );

  return directions.length > 0 ? directions.slice(0, 4) : undefined;
}

function hasDefinedSummaryValue(value: object): boolean {
  return Object.values(value).some((entry) => entry !== undefined);
}

function isRealtimeSmokeProofStatus(value: unknown): value is RealtimeSmokeProofStatus {
  return value === "passed" || value === "failed" || value === "skipped";
}

function isNoEntryError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
