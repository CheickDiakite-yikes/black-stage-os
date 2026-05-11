import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";

export const LIVE_SMOKE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE_SMOKE";
export const REALTIME_REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER",
  "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN"
];

export function createRealtimeLivePreflight({
  env = process.env,
  localEnv,
  shellLiveSmokeArmed
} = {}) {
  const localEnvIncludesLiveFlag = Boolean(
    localEnv?.loadedEnvVars?.includes(LIVE_SMOKE_ENV_VAR) ||
    localEnv?.skippedEnvVars?.includes(LIVE_SMOKE_ENV_VAR)
  );
  const requiredEnv = Object.fromEntries(
    REALTIME_REQUIRED_ENV_VARS.map((envVar) => [
      envVar,
      env[envVar]?.trim() ? "set" : "unset"
    ])
  );
  const missingEnv = REALTIME_REQUIRED_ENV_VARS.filter(
    (envVar) => !env[envVar]?.trim()
  );
  const liveSmokeArmedByShell = Boolean(shellLiveSmokeArmed);
  const okToRun = liveSmokeArmedByShell && missingEnv.length === 0;
  const notes = createNotes({
    okToRun,
    localEnvIncludesLiveFlag,
    shellLiveSmokeArmed: liveSmokeArmedByShell
  });

  return {
    okToRun,
    liveSmokeArmed: liveSmokeArmedByShell,
    liveSmokeArmedByShell,
    localEnvIncludesLiveFlag,
    localEnv: summarizeLocalEnvLoad(localEnv ?? emptyLocalEnv()),
    requiredEnv,
    missingEnv,
    openAiNetworkCallWouldRun: okToRun,
    browserReceivesStandardApiKey: false,
    cheapTestGuard: {
      liveCallRequiresExplicitArm: true,
      browserSendsAudio: false
    },
    notes
  };
}

function createNotes({ okToRun, localEnvIncludesLiveFlag, shellLiveSmokeArmed }) {
  if (okToRun) {
    return [
      "pnpm smoke:realtime is armed for a live SDP exchange through the local broker.",
      "The browser still receives no standard OpenAI API key."
    ];
  }

  if (localEnvIncludesLiveFlag && !shellLiveSmokeArmed) {
    return [
      "Live Realtime smoke is not armed because the live flag must be exported in the shell before this script starts.",
      "Local env files may provide credentials, but they cannot arm a paid OpenAI call by themselves."
    ];
  }

  return [
    "Live Realtime smoke is not armed.",
    "Set the live flag, safety identifier, and local approval token only from a shell you control."
  ];
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
  const shellLiveSmokeArmed = process.env[LIVE_SMOKE_ENV_VAR] === "1";
  const localEnv = loadLocalEnvFile();
  const preflight = createRealtimeLivePreflight({
    env: process.env,
    localEnv,
    shellLiveSmokeArmed
  });

  console.log(JSON.stringify(preflight, null, 2));

  if (preflight.liveSmokeArmedByShell && !preflight.okToRun) {
    process.exitCode = 1;
  }
}
