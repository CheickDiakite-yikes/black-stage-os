import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { loadLocalEnvFile } from "./local-env.mjs";
import {
  REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS,
  REALTIME_LIVE_SMOKE_TIMEOUT_ENV_VAR,
  createRealtimeLiveSmokeCheapGuard
} from "./realtime-live-smoke-cheap-guard.mjs";

export {
  REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS,
  REALTIME_LIVE_SMOKE_TIMEOUT_ENV_VAR
} from "./realtime-live-smoke-cheap-guard.mjs";

export const REALTIME_LIVE_SMOKE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE_SMOKE";
export const REALTIME_SAFETY_IDENTIFIER_ENV_VAR =
  "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER";
export const REALTIME_RUN_APPROVAL_TOKEN_ENV_VAR =
  "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN";
export const REALTIME_SMOKE_PROOF_PATH_ENV_VAR = "BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH";
export const OPENAI_API_KEY_ENV_VAR = "OPENAI_API_KEY";

export function createRealtimeSmokeEnvPlan(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const createdAt = options.createdAt ?? new Date().toISOString();
  const approvalToken =
    options.approvalToken ?? `bstage-${randomBytes(18).toString("base64url")}`;
  const safetyIdentifier =
    options.safetyIdentifier ?? createRealtimeSmokeSafetyIdentifier(repoRoot);
  const proofPath =
    options.proofPath ??
    `.blackstage/realtime-smoke/live-${slugifyTimestamp(createdAt)}.json`;
  const openAiApiKeyStatus =
    options.openAiApiKeyStatus ??
    (process.env[OPENAI_API_KEY_ENV_VAR]?.trim() ? "set" : "unset");

  return {
    createdAt,
    repoRoot,
    openAiApiKeyStatus,
    exports: {
      [REALTIME_LIVE_SMOKE_ENV_VAR]: "1",
      [REALTIME_SAFETY_IDENTIFIER_ENV_VAR]: safetyIdentifier,
      [REALTIME_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalToken,
      [REALTIME_SMOKE_PROOF_PATH_ENV_VAR]: proofPath,
      [REALTIME_LIVE_SMOKE_TIMEOUT_ENV_VAR]: String(REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS)
    },
    command: "pnpm smoke:realtime",
    cheapTestGuard: createRealtimeLiveSmokeCheapGuard({
      env: options.env ?? process.env
    }),
    browserReceivesStandardApiKey: false,
    writesEnvFile: false,
    openAiNetworkCallWouldRunAfterExport: openAiApiKeyStatus === "set"
  };
}

export function createRealtimeSmokeSafetyIdentifier(repoRoot = process.cwd()) {
  const absoluteRepoRoot = resolve(repoRoot);
  const packageName = readPackageName(absoluteRepoRoot);
  const stableSeed = `${packageName}\n${basename(absoluteRepoRoot)}\n${absoluteRepoRoot}`;
  const digest = createHash("sha256").update(stableSeed).digest("hex").slice(0, 20);

  return `blackstage-local-${digest}`;
}

export function renderRealtimeSmokeEnvPlan(plan) {
  const lines = [
    "# Realtime live-smoke arming values for this shell only.",
    "# Review these before running; no env file was written.",
    "# Cheap guard: SDP-only, recvonly audio section, no microphone track, timeout capped at 15000 ms.",
    "# Safety guard: local env files may hold credentials but cannot arm live smoke by themselves.",
    plan.openAiApiKeyStatus === "set"
      ? "# OPENAI_API_KEY is already set in this shell."
      : "# OPENAI_API_KEY is unset; export it in this shell before running.",
    ...Object.entries(plan.exports).map(
      ([envVar, value]) => `export ${envVar}=${shellQuote(value)}`
    ),
    plan.command
  ];

  return `${lines.join("\n")}\n`;
}

function readPackageName(repoRoot) {
  try {
    const packageJson = JSON.parse(readFileSync(`${repoRoot}/package.json`, "utf8"));

    return typeof packageJson.name === "string" && packageJson.name.trim()
      ? packageJson.name
      : "black-stage-os";
  } catch {
    return "black-stage-os";
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function slugifyTimestamp(value) {
  return value.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-+|-+$/g, "");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadLocalEnvFile();
  console.log(renderRealtimeSmokeEnvPlan(createRealtimeSmokeEnvPlan()));
}
