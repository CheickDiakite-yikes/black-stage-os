import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";
import { OPENAI_API_KEY_ENV_VAR } from "./prepare-realtime-smoke-env.mjs";

export const AGENTS_SDK_LIVE_ENV_VAR = "BLACKSTAGE_AGENTS_SDK_LIVE_ENABLED";
export const AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR =
  "BLACKSTAGE_AGENTS_SDK_RUN_APPROVAL_TOKEN";

export function createAgentsSdkPreflight({
  env = process.env,
  localEnv,
  shellAgentsSdkLiveEnabled,
  shellApprovalTokenSet
} = {}) {
  const localEnvIncludesLiveFlag = localEnvIncludes(localEnv, AGENTS_SDK_LIVE_ENV_VAR);
  const localEnvIncludesApprovalToken = localEnvIncludes(
    localEnv,
    AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR
  );
  const agentsSdkLiveArmedByShell = Boolean(shellAgentsSdkLiveEnabled);
  const approvalTokenSetByShell = Boolean(shellApprovalTokenSet);
  const openAiApiKeySet = Boolean(env[OPENAI_API_KEY_ENV_VAR]?.trim());
  const missingShellEnv = [
    agentsSdkLiveArmedByShell ? undefined : AGENTS_SDK_LIVE_ENV_VAR,
    approvalTokenSetByShell ? undefined : AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR
  ].filter(Boolean);
  const missingRuntimeEnv = [
    openAiApiKeySet ? undefined : OPENAI_API_KEY_ENV_VAR
  ].filter(Boolean);
  const okToRun =
    agentsSdkLiveArmedByShell && approvalTokenSetByShell && openAiApiKeySet;

  return {
    okToRun,
    agentsSdkMode: okToRun ? "live_ready" : "dry_run",
    agentsSdkLiveArmed: agentsSdkLiveArmedByShell,
    agentsSdkLiveArmedByShell,
    approvalTokenSetByShell,
    localEnvIncludesLiveFlag,
    localEnvIncludesApprovalToken,
    localEnv: summarizeLocalEnvLoad(localEnv ?? emptyLocalEnv()),
    requiredShellEnv: {
      [AGENTS_SDK_LIVE_ENV_VAR]: agentsSdkLiveArmedByShell ? "set" : "unset",
      [AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalTokenSetByShell ? "set" : "unset"
    },
    runtimeEnv: {
      [OPENAI_API_KEY_ENV_VAR]: openAiApiKeySet ? "set" : "unset"
    },
    missingShellEnv,
    missingRuntimeEnv,
    agentsSdkRunWouldStart: okToRun,
    handoffsAllowed: false,
    memoryAccess: {
      retrieval: "redacted_summaries_only",
      rawMemoryAccess: "forbidden",
      writesRequireStageApproval: true,
      deletesRequireStageApproval: true
    },
    tracing: {
      enabled: true,
      redaction: "stage_event_summaries_only"
    },
    browserCanRunAgents: false,
    browserReceivesProviderCredentials: false,
    safetyGuard: {
      liveAgentsRequiresShellArm: true,
      localApprovalHeaderRequired: true,
      browserMutationDisabled: true,
      providerPersistenceForbidden: true
    },
    notes: createNotes({
      okToRun,
      localEnvIncludesLiveFlag,
      localEnvIncludesApprovalToken,
      agentsSdkLiveArmedByShell,
      approvalTokenSetByShell,
      openAiApiKeySet
    })
  };
}

function createNotes({
  okToRun,
  localEnvIncludesLiveFlag,
  localEnvIncludesApprovalToken,
  agentsSdkLiveArmedByShell,
  approvalTokenSetByShell,
  openAiApiKeySet
}) {
  if (okToRun) {
    return [
      "Agents SDK live manager-agent run is armed for this shell.",
      "Browser mutation, raw memory access, handoffs, and provider credential exposure remain disabled."
    ];
  }

  if (
    (localEnvIncludesLiveFlag || localEnvIncludesApprovalToken) &&
    (!agentsSdkLiveArmedByShell || !approvalTokenSetByShell)
  ) {
    return [
      "Agents SDK live execution is not armed because live SDK env must be exported in the shell before this script starts.",
      "Local env files may hold credentials, but they cannot arm live manager-agent work by themselves."
    ];
  }

  if (!openAiApiKeySet) {
    return [
      "Agents SDK live execution is not armed.",
      "OPENAI_API_KEY is unset; keep provider credentials local and redacted before any live run."
    ];
  }

  return [
    "Agents SDK live execution is not armed.",
    "Export the live SDK flag and local approval token only from a shell you control."
  ];
}

function localEnvIncludes(localEnv, envVar) {
  return Boolean(
    localEnv?.loadedEnvVars?.includes(envVar) ||
    localEnv?.skippedEnvVars?.includes(envVar)
  );
}

function emptyLocalEnv() {
  return {
    loaded: false,
    envPath: ".env",
    loadedEnvVars: [],
    skippedEnvVars: []
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const shellAgentsSdkLiveEnabled = process.env[AGENTS_SDK_LIVE_ENV_VAR] === "1";
  const shellApprovalTokenSet = Boolean(
    process.env[AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR]?.trim()
  );
  const localEnv = loadLocalEnvFile();
  const preflight = createAgentsSdkPreflight({
    env: process.env,
    localEnv,
    shellAgentsSdkLiveEnabled,
    shellApprovalTokenSet
  });

  console.log(JSON.stringify(preflight, null, 2));

  if (preflight.agentsSdkLiveArmedByShell && !preflight.okToRun) {
    process.exitCode = 1;
  }
}
