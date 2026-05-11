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
  missingEnv: string[];
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
    missingEnv: candidate.missingEnv.filter(
      (envVar): envVar is string => typeof envVar === "string"
    )
  };
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
