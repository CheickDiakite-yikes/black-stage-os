import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { URL } from "node:url";
import { loadLocalEnvFile } from "./local-env.mjs";
import {
  OPENAI_API_KEY_ENV_VAR,
  REALTIME_RUN_APPROVAL_TOKEN_ENV_VAR,
  REALTIME_SAFETY_IDENTIFIER_ENV_VAR,
  createRealtimeSmokeSafetyIdentifier
} from "./prepare-realtime-smoke-env.mjs";

export const LIVE_VOICE_BROKER_LIVE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE";
export const LIVE_VOICE_BROKER_ALLOWED_ORIGINS_ENV_VAR =
  "BLACKSTAGE_BROKER_ALLOWED_ORIGINS";
export const LIVE_VOICE_STAGE_BROKER_URL_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_BROKER_URL";
export const LIVE_VOICE_STAGE_WEBRTC_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED";
export const LIVE_VOICE_STAGE_APPROVAL_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN";
export const LIVE_VOICE_STAGE_AUDIO_ENV_VAR = "VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED";
export const LIVE_VOICE_STAGE_DEBUG_ENV_VAR = "VITE_BLACKSTAGE_REALTIME_DEBUG_ENABLED";
export const LIVE_VOICE_STAGE_TEXT_PROBE_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_TEXT_PROBE";
export const LIVE_VOICE_STAGE_TOOL_PROBE_ENV_VAR =
  "VITE_BLACKSTAGE_REALTIME_TOOL_PROBE";

export function createLiveVoiceTestEnvPlan(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const approvalToken =
    options.approvalToken ?? `bstage-live-${randomBytes(18).toString("base64url")}`;
  const safetyIdentifier =
    options.safetyIdentifier ?? createRealtimeSmokeSafetyIdentifier(repoRoot);
  const stageHost = options.stageHost ?? "127.0.0.1";
  const stagePort = Number(options.stagePort ?? 4187);
  const brokerHost = options.brokerHost ?? "127.0.0.1";
  const brokerPort = Number(options.brokerPort ?? 8798);
  const stageBaseUrl = `http://${stageHost}:${stagePort}`;
  const brokerBaseUrl = `http://${brokerHost}:${brokerPort}`;
  const openAiApiKeyStatus =
    options.openAiApiKeyStatus ??
    (process.env[OPENAI_API_KEY_ENV_VAR]?.trim() ? "set" : "unset");

  return {
    repoRoot,
    openAiApiKeyStatus,
    approvalToken,
    safetyIdentifier,
    stageBaseUrl,
    brokerBaseUrl,
    browserReceivesStandardApiKey: false,
    writesEnvFile: false,
    printsOpenAiApiKey: false,
    startsProviderCallByItself: false,
    startsMicrophoneByItself: false,
    providerCallRequiresOrbClick: true,
    providerCallRequiresStageApproval: true,
    microphoneRequiresAudioFlag: true,
    microphoneRequiresBrowserPermission: true,
    brokerEnv: {
      [LIVE_VOICE_BROKER_LIVE_ENV_VAR]: "1",
      [REALTIME_SAFETY_IDENTIFIER_ENV_VAR]: safetyIdentifier,
      [REALTIME_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalToken,
      [LIVE_VOICE_BROKER_ALLOWED_ORIGINS_ENV_VAR]: `${stageBaseUrl},http://localhost:${stagePort}`
    },
    stageWebEnv: {
      [LIVE_VOICE_STAGE_BROKER_URL_ENV_VAR]: brokerBaseUrl,
      [LIVE_VOICE_STAGE_WEBRTC_ENV_VAR]: "1",
      [LIVE_VOICE_STAGE_APPROVAL_ENV_VAR]: approvalToken,
      [LIVE_VOICE_STAGE_DEBUG_ENV_VAR]: "1"
    },
    textProbe:
      options.textProbe ?? "Say one short sentence about what Blackstage is doing.",
    toolProbe:
      options.toolProbe ??
      "Prepare a safe external action brief for requesting diligence materials. Use the available tool."
  };
}

export function renderLiveVoiceTestEnvPlan(plan) {
  const noMicStageEnv = {
    ...plan.stageWebEnv,
    [LIVE_VOICE_STAGE_AUDIO_ENV_VAR]: "0"
  };
  const noMicToolStageEnv = {
    ...noMicStageEnv,
    [LIVE_VOICE_STAGE_TEXT_PROBE_ENV_VAR]: plan.textProbe,
    [LIVE_VOICE_STAGE_TOOL_PROBE_ENV_VAR]: plan.toolProbe
  };
  const micStageEnv = {
    ...plan.stageWebEnv,
    [LIVE_VOICE_STAGE_AUDIO_ENV_VAR]: "1"
  };

  const lines = [
    "# Blackstage live voice test commands.",
    "# This helper prints commands only: no env file was written, no provider call was made, and no microphone stream was started.",
    "# Provider calls happen only after Stage Web opens, the center orb is clicked, and the live Realtime approval is accepted.",
    "# Microphone audio is sent only in the mic command, after browser permission.",
    plan.openAiApiKeyStatus === "set"
      ? "# OPENAI_API_KEY is available to this shell through local env loading; it is not printed below."
      : "# OPENAI_API_KEY is unset; add it to .env.local or export it in Terminal A before starting the broker.",
    "",
    "# Terminal A: broker",
    "set -a",
    "[ -f .env.local ] && . ./.env.local",
    "set +a",
    ...Object.entries(plan.brokerEnv).map(
      ([envVar, value]) => `export ${envVar}=${shellQuote(value)}`
    ),
    "pnpm dev:broker",
    "",
    "# Terminal B: Stage Web, no microphone",
    renderInlineEnvCommand(noMicStageEnv, plan.stageBaseUrl),
    "",
    "# Terminal B: Stage Web, no microphone plus text/tool probes",
    renderInlineEnvCommand(noMicToolStageEnv, plan.stageBaseUrl),
    "",
    "# Terminal B: Stage Web with microphone enabled for the real voice pass",
    renderInlineEnvCommand(micStageEnv, plan.stageBaseUrl),
    "",
    `# Open ${plan.stageBaseUrl}, click the center orb, approve the live edge, then speak.`
  ];

  return `${lines.join("\n")}\n`;
}

function renderInlineEnvCommand(env, stageBaseUrl) {
  const envLines = Object.entries(env).map(
    ([envVar, value]) => `${envVar}=${shellQuote(value)} \\`
  );

  return [
    ...envLines,
    `pnpm --filter @blackstage/stage-web dev --host ${new URL(stageBaseUrl).hostname} --port ${new URL(stageBaseUrl).port}`
  ].join("\n");
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadLocalEnvFile();
  console.log(renderLiveVoiceTestEnvPlan(createLiveVoiceTestEnvPlan()));
}
