import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";
import {
  LIVE_SMOKE_ENV_VAR,
  createRealtimeLivePreflight
} from "./preflight-realtime-live.mjs";
import {
  CODEX_RUN_APPROVAL_TOKEN_ENV_VAR,
  CODEX_SUBPROCESS_ENV_VAR,
  createCodexRunnerPreflight
} from "./preflight-codex-runner.mjs";
import {
  AGENTS_SDK_LIVE_ENV_VAR,
  AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR,
  createAgentsSdkPreflight
} from "./preflight-agents-sdk.mjs";

export function createLiveReadinessPreflight({
  env = process.env,
  localEnv,
  shellState = readShellState(env)
} = {}) {
  const realtime = createRealtimeLivePreflight({
    env,
    localEnv,
    shellLiveSmokeArmed: shellState.realtimeLiveSmokeArmed
  });
  const codexRunner = createCodexRunnerPreflight({
    env,
    localEnv,
    shellCodexSubprocessEnabled: shellState.codexSubprocessEnabled,
    shellApprovalTokenSet: shellState.codexApprovalTokenSet
  });
  const agentsSdk = createAgentsSdkPreflight({
    env,
    localEnv,
    shellAgentsSdkLiveEnabled: shellState.agentsSdkLiveEnabled,
    shellApprovalTokenSet: shellState.agentsSdkApprovalTokenSet
  });
  const shellArmedButBlocked = [
    realtime.liveSmokeArmedByShell && !realtime.okToRun ? "realtime" : undefined,
    codexRunner.codexSubprocessArmedByShell && !codexRunner.okToRun
      ? "codex_runner"
      : undefined,
    agentsSdk.agentsSdkLiveArmedByShell && !agentsSdk.okToRun ? "agents_sdk" : undefined
  ].filter(Boolean);

  return {
    okToRun: realtime.okToRun && codexRunner.okToRun && agentsSdk.okToRun,
    anyLiveGateArmed:
      realtime.liveSmokeArmedByShell ||
      codexRunner.codexSubprocessArmedByShell ||
      agentsSdk.agentsSdkLiveArmedByShell,
    allLiveGatesArmed: realtime.okToRun && codexRunner.okToRun && agentsSdk.okToRun,
    shellArmedButBlocked,
    noExternalActionTaken: true,
    localEnv: summarizeLocalEnvLoad(localEnv ?? emptyLocalEnv()),
    gates: {
      realtime,
      codexRunner,
      agentsSdk
    },
    notes:
      shellArmedButBlocked.length > 0
        ? [
            "One or more live gates were shell-armed but blocked by missing shell/runtime requirements.",
            "No live provider call, subprocess, tool execution, trace upload, or memory action ran."
          ]
        : [
            "Live readiness preflight completed without external actions.",
            "Use the individual preflight outputs before explicitly arming any live run."
          ]
  };
}

function readShellState(env) {
  return {
    realtimeLiveSmokeArmed: env[LIVE_SMOKE_ENV_VAR] === "1",
    codexSubprocessEnabled: env[CODEX_SUBPROCESS_ENV_VAR] === "1",
    codexApprovalTokenSet: Boolean(env[CODEX_RUN_APPROVAL_TOKEN_ENV_VAR]?.trim()),
    agentsSdkLiveEnabled: env[AGENTS_SDK_LIVE_ENV_VAR] === "1",
    agentsSdkApprovalTokenSet: Boolean(
      env[AGENTS_SDK_RUN_APPROVAL_TOKEN_ENV_VAR]?.trim()
    )
  };
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
  const shellState = readShellState(process.env);
  const localEnv = loadLocalEnvFile();
  const preflight = createLiveReadinessPreflight({
    env: process.env,
    localEnv,
    shellState
  });

  console.log(JSON.stringify(preflight, null, 2));

  if (preflight.shellArmedButBlocked.length > 0) {
    process.exitCode = 1;
  }
}
