/* global AbortSignal, RTCPeerConnection, fetch, window */

import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
  STAGE_BROKER_APPROVAL_HEADER,
  STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR,
  createStageBrokerRuntimeConfig,
  createStageBrokerServer
} from "../apps/stage-broker/dist/index.js";
import {
  createRealtimeLiveSmokeProof,
  createRequiredEnvStatus,
  createSafeRealtimeSmokeErrorMessage,
  writeRealtimeLiveSmokeProof
} from "./realtime-live-smoke-proof.mjs";
import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";
import {
  REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS,
  assertRealtimeLiveSmokeOfferIsCheap,
  createRealtimeLiveSmokeCheapGuard,
  readRealtimeLiveSmokeTimeoutMs
} from "./realtime-live-smoke-cheap-guard.mjs";

const LIVE_SMOKE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE_SMOKE";
const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER",
  STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR
];
const shellLiveSmokeArmedAtStartup = process.env[LIVE_SMOKE_ENV_VAR] === "1";
let openAiNetworkCallAttempted = false;

async function main() {
  const localEnv = loadLocalEnvFile();
  const localEnvIncludesLiveFlag =
    localEnv.loadedEnvVars.includes(LIVE_SMOKE_ENV_VAR) ||
    localEnv.skippedEnvVars.includes(LIVE_SMOKE_ENV_VAR);
  const requiredEnv = createRequiredEnvStatus(process.env, REQUIRED_ENV_VARS);
  const missingEnvVars = REQUIRED_ENV_VARS.filter(
    (envVar) => !process.env[envVar]?.trim()
  );

  if (!shellLiveSmokeArmedAtStartup) {
    console.log(
      `Skipped live Realtime smoke. Export ${LIVE_SMOKE_ENV_VAR}=1 in the shell with local broker/OpenAI env to run. Run pnpm preflight:realtime for redacted readiness.`
    );
    await writeProof({
      status: "skipped",
      liveSmokeArmed: false,
      requiredEnv,
      localEnv: summarizeLocalEnvLoad(localEnv),
      missingEnv: missingEnvVars,
      openAiNetworkCallAttempted: false,
      browserSendsAudio: false,
      cheapTestGuard: createRealtimeLiveSmokeCheapGuard(),
      notes: createSkippedNotes(localEnvIncludesLiveFlag)
    });
    return;
  }

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Live Realtime smoke is missing required env: ${missingEnvVars.join(", ")}`
    );
  }

  const browser = await chromium.launch({
    headless: true
  });
  const runtimeConfig = createStageBrokerRuntimeConfig({
    ...process.env,
    BLACKSTAGE_BROKER_PORT: "0",
    BLACKSTAGE_REALTIME_LIVE: "1"
  });
  const server = createStageBrokerServer({
    runtimeConfig
  });

  try {
    await listen(server, runtimeConfig.host);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Stage broker smoke server did not expose a TCP address.");
    }

    const routeUrl = `http://${runtimeConfig.host}:${address.port}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`;
    const offerSdp = await createBrowserDataChannelOffer(browser);
    const offerSummary = assertRealtimeLiveSmokeOfferIsCheap(offerSdp);
    const timeoutMs = readRealtimeLiveSmokeTimeoutMs();
    openAiNetworkCallAttempted = true;
    const response = await fetch(routeUrl, {
      method: "POST",
      headers: {
        "content-type": "application/sdp",
        [STAGE_BROKER_APPROVAL_HEADER]:
          process.env[STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR]
      },
      body: offerSdp,
      signal: AbortSignal.timeout(timeoutMs)
    });
    const answerSdp = await response.text();

    if (!response.ok || !answerSdp.trim()) {
      throw new Error(
        `Live Realtime smoke failed with HTTP ${response.status}: ${answerSdp}`
      );
    }

    const answerDigest = createHash("sha256")
      .update(answerSdp)
      .digest("hex")
      .slice(0, 12);

    const proofResult = await writeProof({
      status: "passed",
      route: BLACKSTAGE_REALTIME_BROKER_ROUTE,
      liveSmokeArmed: true,
      requiredEnv,
      missingEnv: [],
      openAiNetworkCallAttempted: true,
      offerBytes: Buffer.byteLength(offerSdp, "utf8"),
      answerBytes: Buffer.byteLength(answerSdp, "utf8"),
      answerSha256Prefix: answerDigest,
      browserSendsAudio: false,
      cheapTestGuard: createRealtimeLiveSmokeCheapGuard({
        offerSdp
      }),
      localEnv: summarizeLocalEnvLoad(localEnv),
      notes: [
        "Live Realtime SDP exchange completed through the local broker.",
        `Cheap-test guard: timeout capped at ${REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS} ms and browser audio disabled.`
      ]
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          route: BLACKSTAGE_REALTIME_BROKER_ROUTE,
          offerBytes: Buffer.byteLength(offerSdp, "utf8"),
          answerBytes: Buffer.byteLength(answerSdp, "utf8"),
          answerSha256Prefix: answerDigest,
          browserReceivesStandardApiKey: false,
          browserSendsAudio: false,
          timeoutMs,
          offerSummary,
          maxProviderRequests: 1,
          redactedProofPath: proofResult?.proofPath
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

async function writeProof(input) {
  const proof = createRealtimeLiveSmokeProof(input);
  const proofResult = await writeRealtimeLiveSmokeProof(proof);

  if (proofResult && input.status !== "passed") {
    console.log(`Redacted Realtime smoke proof written to ${proofResult.proofPath}`);
  }

  return proofResult;
}

async function createBrowserDataChannelOffer(browser) {
  const page = await browser.newPage();

  try {
    return await page.evaluate(async () => {
      const peerConnection = new RTCPeerConnection();
      const waitForIceGathering = () => {
        if (peerConnection.iceGatheringState === "complete") {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          const timeout = window.setTimeout(resolve, 2_000);

          peerConnection.addEventListener("icegatheringstatechange", () => {
            if (peerConnection.iceGatheringState === "complete") {
              window.clearTimeout(timeout);
              resolve(undefined);
            }
          });
        });
      };

      try {
        peerConnection.createDataChannel("oai-events");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await waitForIceGathering(peerConnection);

        const sdp = peerConnection.localDescription?.sdp ?? offer.sdp ?? "";

        if (!sdp.trim()) {
          throw new Error("Browser WebRTC offer SDP was empty.");
        }

        return sdp;
      } finally {
        peerConnection.close();
      }
    });
  } finally {
    await page.close();
  }
}

function listen(server, host) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function createSkippedNotes(localEnvIncludesLiveFlag) {
  if (localEnvIncludesLiveFlag) {
    return [
      "Live Realtime smoke was not armed because the live flag must be exported in the shell before this script starts.",
      "Local env files may provide credentials, but they cannot arm a paid OpenAI call by themselves.",
      "Cheap-test guard: SDP-only, no browser audio."
    ];
  }

  return [
    "Live Realtime smoke was not armed; no OpenAI network call ran.",
    "Cheap-test guard: SDP-only, no browser audio."
  ];
}

main().catch(async (error) => {
  try {
    await writeProof({
      status: "failed",
      liveSmokeArmed: shellLiveSmokeArmedAtStartup,
      requiredEnv: createRequiredEnvStatus(process.env, REQUIRED_ENV_VARS),
      localEnv: summarizeLocalEnvLoad(loadLocalEnvFile()),
      missingEnv: REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]?.trim()),
      openAiNetworkCallAttempted,
      browserSendsAudio: false,
      cheapTestGuard: createRealtimeLiveSmokeCheapGuard(),
      errorMessage: createSafeRealtimeSmokeErrorMessage(error)
    });
  } catch {
    // Preserve the original failure; proof writing is helpful but secondary.
  }

  console.error(createSafeRealtimeSmokeErrorMessage(error));
  process.exitCode = 1;
});
