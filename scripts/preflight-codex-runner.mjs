import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";

export const CODEX_SUBPROCESS_ENV_VAR = "BLACKSTAGE_CODEX_SUBPROCESS_ENABLED";
export const CODEX_RUN_APPROVAL_TOKEN_ENV_VAR = "BLACKSTAGE_CODEX_RUN_APPROVAL_TOKEN";
export const CODEX_TRANSPORT_ENV_VAR = "BLACKSTAGE_CODEX_TRANSPORT";

export function createCodexRunnerPreflight({
  env = process.env,
  localEnv,
  shellCodexSubprocessEnabled,
  shellApprovalTokenSet
} = {}) {
  const localEnvIncludesCodexSubprocessFlag = localEnvIncludes(
    localEnv,
    CODEX_SUBPROCESS_ENV_VAR
  );
  const localEnvIncludesApprovalToken = localEnvIncludes(
    localEnv,
    CODEX_RUN_APPROVAL_TOKEN_ENV_VAR
  );
  const codexSubprocessArmedByShell = Boolean(shellCodexSubprocessEnabled);
  const approvalTokenSetByShell = Boolean(shellApprovalTokenSet);
  const missingShellEnv = [
    codexSubprocessArmedByShell ? undefined : CODEX_SUBPROCESS_ENV_VAR,
    approvalTokenSetByShell ? undefined : CODEX_RUN_APPROVAL_TOKEN_ENV_VAR
  ].filter(Boolean);
  const okToRun = codexSubprocessArmedByShell && approvalTokenSetByShell;

  return {
    okToRun,
    codexSubprocessArmed: codexSubprocessArmedByShell,
    codexSubprocessArmedByShell,
    approvalTokenSetByShell,
    localEnvIncludesCodexSubprocessFlag,
    localEnvIncludesApprovalToken,
    localEnv: summarizeLocalEnvLoad(localEnv ?? emptyLocalEnv()),
    requiredShellEnv: {
      [CODEX_SUBPROCESS_ENV_VAR]: codexSubprocessArmedByShell ? "set" : "unset",
      [CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalTokenSetByShell ? "set" : "unset"
    },
    missingShellEnv,
    codexTransport: codexSubprocessArmedByShell
      ? "cli"
      : parseDryRunTransport(env[CODEX_TRANSPORT_ENV_VAR]),
    codexSubprocessWouldRun: okToRun,
    browserCanRunCodex: false,
    browserReceivesProviderCredentials: false,
    safetyGuard: {
      liveCodexRequiresShellArm: true,
      localApprovalHeaderRequired: true,
      browserMutationDisabled: true
    },
    notes: createNotes({
      okToRun,
      localEnvIncludesCodexSubprocessFlag,
      localEnvIncludesApprovalToken,
      codexSubprocessArmedByShell,
      approvalTokenSetByShell
    })
  };
}

function createNotes({
  okToRun,
  localEnvIncludesCodexSubprocessFlag,
  localEnvIncludesApprovalToken,
  codexSubprocessArmedByShell,
  approvalTokenSetByShell
}) {
  if (okToRun) {
    return [
      "Live Codex subprocess run-next is armed for this shell.",
      "The browser still cannot enqueue or run Codex directly."
    ];
  }

  if (
    (localEnvIncludesCodexSubprocessFlag || localEnvIncludesApprovalToken) &&
    (!codexSubprocessArmedByShell || !approvalTokenSetByShell)
  ) {
    return [
      "Live Codex subprocess execution is not armed because live runner env must be exported in the shell before this script starts.",
      "Local env files may be loaded for metadata, but they cannot arm live Codex work by themselves."
    ];
  }

  return [
    "Live Codex subprocess execution is not armed.",
    "Export the subprocess flag and local approval token only from a shell you control."
  ];
}

function localEnvIncludes(localEnv, envVar) {
  return Boolean(
    localEnv?.loadedEnvVars?.includes(envVar) ||
    localEnv?.skippedEnvVars?.includes(envVar)
  );
}

function parseDryRunTransport(value) {
  return value === "app_server" ? "app_server" : "cli";
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
  const shellCodexSubprocessEnabled = process.env[CODEX_SUBPROCESS_ENV_VAR] === "1";
  const shellApprovalTokenSet = Boolean(
    process.env[CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]?.trim()
  );
  const localEnv = loadLocalEnvFile();
  const preflight = createCodexRunnerPreflight({
    env: process.env,
    localEnv,
    shellCodexSubprocessEnabled,
    shellApprovalTokenSet
  });

  console.log(JSON.stringify(preflight, null, 2));

  if (preflight.codexSubprocessArmedByShell && !preflight.okToRun) {
    process.exitCode = 1;
  }
}
