import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

export const REALTIME_SMOKE_PROOF_PATH_ENV_VAR = "BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH";
export const REALTIME_SMOKE_PROOF_KIND = "blackstage.realtime.live_smoke";

const SECRET_PATTERNS = [
  [/sk-(?:proj-)?[A-Za-z0-9_-]{12,}/g, "[redacted]"],
  [
    /((?:approval(?:[_ -]?token)?|x-blackstage-realtime-approval)["':= ]+)[A-Za-z0-9_.:-]{6,}/gi,
    "$1[redacted]"
  ]
];

export function createRealtimeLiveSmokeProof(input) {
  return compactObject({
    proofVersion: 1,
    kind: REALTIME_SMOKE_PROOF_KIND,
    status: normalizeStatus(input.status),
    createdAt: input.createdAt ?? new Date().toISOString(),
    route: input.route,
    liveSmokeArmed: Boolean(input.liveSmokeArmed),
    openAiNetworkCallAttempted: Boolean(input.openAiNetworkCallAttempted),
    browserReceivesStandardApiKey: false,
    browserSendsAudio: Boolean(input.browserSendsAudio),
    requiredEnv: normalizeRequiredEnv(input.requiredEnv ?? {}),
    missingEnv: Array.isArray(input.missingEnv) ? input.missingEnv : [],
    offerBytes: normalizeOptionalNumber(input.offerBytes),
    answerBytes: normalizeOptionalNumber(input.answerBytes),
    answerSha256Prefix: normalizeDigest(input.answerSha256Prefix),
    errorMessage: input.errorMessage
      ? createSafeRealtimeSmokeErrorMessage(input.errorMessage)
      : undefined,
    notes: normalizeNotes(input.notes)
  });
}

export async function writeRealtimeLiveSmokeProof(proof, options = {}) {
  const resolved = resolveRealtimeSmokeProofPath(
    options.proofPath ?? process.env[REALTIME_SMOKE_PROOF_PATH_ENV_VAR],
    options.repoRoot
  );

  if (!resolved) {
    return undefined;
  }

  await mkdir(dirname(resolved.absolutePath), {
    recursive: true
  });
  await writeFile(resolved.absolutePath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

  return {
    proofPath: resolved.proofPath
  };
}

export function resolveRealtimeSmokeProofPath(rawPath, repoRoot = process.cwd()) {
  if (!rawPath?.trim()) {
    return undefined;
  }

  const absoluteRepoRoot = resolve(repoRoot);
  const absoluteBlackstageRoot = resolve(absoluteRepoRoot, ".blackstage");
  const absolutePath = resolve(absoluteRepoRoot, rawPath);

  if (
    absolutePath !== absoluteBlackstageRoot &&
    !absolutePath.startsWith(`${absoluteBlackstageRoot}${sep}`)
  ) {
    throw new Error("Realtime smoke proof path must stay inside .blackstage/.");
  }

  return {
    absolutePath,
    proofPath: normalizePath(relative(absoluteRepoRoot, absolutePath))
  };
}

export function createRequiredEnvStatus(env, requiredEnvVars) {
  return Object.fromEntries(
    requiredEnvVars.map((envVar) => [
      envVar,
      typeof env[envVar] === "string" && env[envVar].trim() ? "set" : "unset"
    ])
  );
}

export function createSafeRealtimeSmokeErrorMessage(error) {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (looksLikeRawSdp(rawMessage)) {
    return "Live Realtime smoke failed with protocol output; raw SDP omitted.";
  }

  const redacted = SECRET_PATTERNS.reduce(
    (message, [pattern, replacement]) => message.replace(pattern, replacement),
    rawMessage
  );

  return redacted.split("\n").join(" ").slice(0, 240);
}

function normalizeStatus(status) {
  if (status === "passed" || status === "failed" || status === "skipped") {
    return status;
  }

  return "failed";
}

function normalizeRequiredEnv(requiredEnv) {
  return Object.fromEntries(
    Object.entries(requiredEnv).map(([envVar, status]) => [
      envVar,
      status === "set" ? "set" : "unset"
    ])
  );
}

function normalizeOptionalNumber(value) {
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function normalizeDigest(value) {
  return typeof value === "string" && /^[a-f0-9]{8,64}$/i.test(value)
    ? value
    : undefined;
}

function normalizeNotes(notes) {
  return Array.isArray(notes)
    ? notes.filter((note) => typeof note === "string" && note.trim()).slice(0, 8)
    : undefined;
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}

function normalizePath(path) {
  return path.split(sep).join("/");
}

function looksLikeRawSdp(message) {
  return /\bv=0\b|\ba=fingerprint:|\ba=ice-|\bm=audio\b|\bm=application\b/.test(
    message
  );
}
