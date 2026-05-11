import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";

const LIVE_SMOKE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE_SMOKE";
const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER",
  "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN"
];

const localEnv = loadLocalEnvFile();
const liveSmokeArmed = process.env[LIVE_SMOKE_ENV_VAR] === "1";
const requiredEnv = Object.fromEntries(
  REQUIRED_ENV_VARS.map((envVar) => [
    envVar,
    process.env[envVar]?.trim() ? "set" : "unset"
  ])
);
const missingEnv = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]?.trim());
const okToRun = liveSmokeArmed && missingEnv.length === 0;

console.log(
  JSON.stringify(
    {
      okToRun,
      liveSmokeArmed,
      localEnv: summarizeLocalEnvLoad(localEnv),
      requiredEnv,
      missingEnv,
      openAiNetworkCallWouldRun: okToRun,
      browserReceivesStandardApiKey: false,
      cheapTestGuard: {
        liveCallRequiresExplicitArm: true,
        browserSendsAudio: false
      },
      notes: okToRun
        ? [
            "pnpm smoke:realtime is armed for a live SDP exchange through the local broker.",
            "The browser still receives no standard OpenAI API key."
          ]
        : [
            "Live Realtime smoke is not armed.",
            "Set the live flag, safety identifier, and local approval token only from a shell you control."
          ]
    },
    null,
    2
  )
);

if (liveSmokeArmed && missingEnv.length > 0) {
  process.exitCode = 1;
}
