import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";

const LIVE_SMOKE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE_SMOKE";
const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER",
  "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN"
];

const shellLiveSmokeArmed = process.env[LIVE_SMOKE_ENV_VAR] === "1";
const localEnv = loadLocalEnvFile();
const localEnvIncludesLiveFlag =
  localEnv.loadedEnvVars.includes(LIVE_SMOKE_ENV_VAR) ||
  localEnv.skippedEnvVars.includes(LIVE_SMOKE_ENV_VAR);
const requiredEnv = Object.fromEntries(
  REQUIRED_ENV_VARS.map((envVar) => [
    envVar,
    process.env[envVar]?.trim() ? "set" : "unset"
  ])
);
const missingEnv = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]?.trim());
const okToRun = shellLiveSmokeArmed && missingEnv.length === 0;
const notes = createNotes({
  okToRun,
  localEnvIncludesLiveFlag,
  shellLiveSmokeArmed
});

console.log(
  JSON.stringify(
    {
      okToRun,
      liveSmokeArmed: shellLiveSmokeArmed,
      liveSmokeArmedByShell: shellLiveSmokeArmed,
      localEnvIncludesLiveFlag,
      localEnv: summarizeLocalEnvLoad(localEnv),
      requiredEnv,
      missingEnv,
      openAiNetworkCallWouldRun: okToRun,
      browserReceivesStandardApiKey: false,
      cheapTestGuard: {
        liveCallRequiresExplicitArm: true,
        browserSendsAudio: false
      },
      notes
    },
    null,
    2
  )
);

if (shellLiveSmokeArmed && missingEnv.length > 0) {
  process.exitCode = 1;
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
