/* global AbortSignal, clearTimeout, fetch, localStorage, setTimeout */

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadLocalEnvFile, summarizeLocalEnvLoad } from "./local-env.mjs";
import {
  REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS,
  createRealtimeLiveSmokeCheapGuard,
  readRealtimeLiveSmokeTimeoutMs
} from "./realtime-live-smoke-cheap-guard.mjs";
import {
  createRealtimeLiveSmokeProof,
  createRequiredEnvStatus,
  createSafeRealtimeSmokeErrorMessage,
  writeRealtimeLiveSmokeProof
} from "./realtime-live-smoke-proof.mjs";

const LIVE_SMOKE_ENV_VAR = "BLACKSTAGE_REALTIME_LIVE_SMOKE";
const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER",
  "BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN"
];
const STAGE_HOST = "127.0.0.1";
const BROKER_ROUTE_PATH = "/api/blackstage/realtime/session";
const runSlug = slugifyTimestamp(new Date().toISOString());
const defaultProofPath = `.blackstage/realtime-smoke/ui-live-${runSlug}.json`;
const shellLiveSmokeArmedAtStartup = process.env[LIVE_SMOKE_ENV_VAR] === "1";

async function main() {
  const localEnv = loadLocalEnvFile();
  const requiredEnv = createRequiredEnvStatus(process.env, REQUIRED_ENV_VARS);
  const missingEnvVars = REQUIRED_ENV_VARS.filter(
    (envVar) => !process.env[envVar]?.trim()
  );

  if (!shellLiveSmokeArmedAtStartup) {
    console.log(
      `Skipped live Realtime UI smoke. Export ${LIVE_SMOKE_ENV_VAR}=1 plus Realtime approval env in the shell to run.`
    );
    await writeProof({
      status: "skipped",
      liveSmokeArmed: false,
      requiredEnv,
      localEnv: summarizeLocalEnvLoad(localEnv),
      missingEnv: missingEnvVars,
      openAiNetworkCallAttempted: false,
      browserSendsAudio: false,
      notes: [
        "Live Realtime UI smoke was not armed; no OpenAI network call ran.",
        "The UI smoke uses the real Stage Web startup orb and approval card when armed.",
        "Cheap guard: no microphone track and timeout capped at 15000 ms."
      ]
    });
    return;
  }

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Live Realtime UI smoke is missing required env: ${missingEnvVars.join(", ")}`
    );
  }

  const timeoutMs = readRealtimeLiveSmokeTimeoutMs();
  const {
    BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN: approvalToken,
    BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: safetyIdentifier,
    OPENAI_API_KEY: openAiApiKey
  } = process.env;
  const { createStageBrokerRuntimeConfig, createStageBrokerServer } = await import(
    "../apps/stage-broker/dist/index.js"
  );
  const runtimeConfig = createStageBrokerRuntimeConfig({
    ...process.env,
    BLACKSTAGE_BROKER_HOST: STAGE_HOST,
    BLACKSTAGE_BROKER_PORT: "0",
    BLACKSTAGE_REALTIME_LIVE: "1",
    BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN: approvalToken,
    BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: safetyIdentifier,
    OPENAI_API_KEY: openAiApiKey
  });
  const brokerServer = createStageBrokerServer({
    runtimeConfig
  });
  const stagePort = await findOpenPort();
  let viteProcess;
  let browser;
  let openAiNetworkCallAttempted = false;

  try {
    await listen(brokerServer, runtimeConfig.host);
    const brokerAddress = brokerServer.address();

    if (!brokerAddress || typeof brokerAddress === "string") {
      throw new Error("Stage broker UI smoke server did not expose a TCP address.");
    }

    const brokerBaseUrl = `http://${runtimeConfig.host}:${brokerAddress.port}`;
    const brokerRouteUrl = `${brokerBaseUrl}${runtimeConfig.routePath}`;
    const stageBaseUrl = `http://${STAGE_HOST}:${stagePort}`;

    viteProcess = await startStageWebVite({
      stagePort,
      env: {
        VITE_BLACKSTAGE_REALTIME_BROKER_URL: brokerBaseUrl,
        VITE_BLACKSTAGE_REALTIME_WEBRTC_ENABLED: "1",
        VITE_BLACKSTAGE_REALTIME_APPROVAL_TOKEN: approvalToken,
        VITE_BLACKSTAGE_REALTIME_AUDIO_ENABLED: "0"
      }
    });

    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: {
        width: 1440,
        height: 1000
      }
    });

    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto(stageBaseUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs
    });
    await waitForLocatorText(page.getByTestId("realtime-broker-status"), "live broker");
    await page.getByTestId("presence-orb").click({
      force: true,
      timeout: 10_000
    });
    await waitForLocatorText(page.getByTestId("approval-card"), "Open live Realtime voice edge");
    openAiNetworkCallAttempted = true;
    await page.getByRole("button", { name: "Approve", exact: true }).click({
      force: true,
      timeout: 10_000
    });
    await waitForLocatorText(page.getByTestId("realtime-broker-status"), "live SDP", timeoutMs);
    await waitForLocatorText(page.getByTestId("stage-presence"), "Listening");

    const stageClass = await page.getByTestId("stage-shell").getAttribute("class");
    const brokerStatus = await page.getByTestId("realtime-broker-status").innerText();
    const screenshotPath = await writeUiSmokeScreenshot(page);

    const proofResult = await writeProof({
      status: "passed",
      route: brokerRouteUrl,
      liveSmokeArmed: true,
      requiredEnv,
      missingEnv: [],
      openAiNetworkCallAttempted: true,
      browserSendsAudio: false,
      localEnv: summarizeLocalEnvLoad(localEnv),
      notes: [
        "Stage Web opened the live Realtime edge from the startup orb after approval.",
        `Cheap-test guard: timeout capped at ${REALTIME_LIVE_SMOKE_TIMEOUT_CAP_MS} ms and browser audio send is disabled.`,
        `UI screenshot: ${screenshotPath}`
      ]
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          stageBaseUrl,
          brokerRoute: BROKER_ROUTE_PATH,
          brokerStatus,
          stageListening: stageClass?.includes("stage-listening") ?? false,
          browserReceivesStandardApiKey: false,
          browserSendsAudio: false,
          timeoutMs,
          screenshotPath,
          redactedProofPath: proofResult?.proofPath
        },
        null,
        2
      )
    );
  } catch (error) {
    await writeProof({
      status: "failed",
      liveSmokeArmed: shellLiveSmokeArmedAtStartup,
      requiredEnv,
      localEnv: summarizeLocalEnvLoad(localEnv),
      missingEnv: missingEnvVars,
      openAiNetworkCallAttempted,
      browserSendsAudio: false,
      errorMessage: createSafeRealtimeSmokeErrorMessage(error),
      notes: [
        "Live Realtime UI smoke failed before proving the approved Stage Web live edge.",
        "Raw SDP, credentials, and approval tokens are omitted from this proof."
      ]
    });
    throw error;
  } finally {
    await browser?.close();
    await closeServer(brokerServer);
    await stopChildProcess(viteProcess);
  }
}

async function writeProof(input) {
  const proof = createRealtimeLiveSmokeProof({
    ...input,
    cheapTestGuard: createRealtimeLiveSmokeCheapGuard({
      env: process.env
    })
  });

  const proofResult = await writeRealtimeLiveSmokeProof(proof, {
    proofPath: process.env.BLACKSTAGE_REALTIME_SMOKE_PROOF_PATH ?? defaultProofPath
  });

  if (proofResult && input.status !== "passed") {
    console.log(`Redacted Realtime UI smoke proof written to ${proofResult.proofPath}`);
  }

  return proofResult;
}

async function writeUiSmokeScreenshot(page) {
  const proofPath = `.blackstage/realtime-smoke/ui-live-${runSlug}.png`;
  const absolutePath = resolve(process.cwd(), proofPath);

  await mkdir(dirname(absolutePath), {
    recursive: true
  });
  await page.screenshot({
    path: absolutePath,
    fullPage: false
  });

  return proofPath;
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
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function startStageWebVite({ stagePort, env }) {
  const viteProcess = spawn(
    "pnpm",
    [
      "--filter",
      "@blackstage/stage-web",
      "exec",
      "vite",
      "--host",
      STAGE_HOST,
      "--port",
      String(stagePort),
      "--strictPort"
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  const logs = [];

  viteProcess.stdout?.on("data", (chunk) => {
    logs.push(String(chunk));
  });
  viteProcess.stderr?.on("data", (chunk) => {
    logs.push(String(chunk));
  });

  await waitForHttp(`http://${STAGE_HOST}:${stagePort}`, 60_000, () =>
    summarizeProcessLogs(logs)
  );

  return viteProcess;
}

async function waitForHttp(url, timeoutMs, describeFailure) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1_000)
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the dev server is ready or the deadline expires.
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for ${url}. ${describeFailure?.() ?? ""}`.trim());
}

async function waitForLocatorText(locator, expectedText, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let latestText = "";

  while (Date.now() < deadline) {
    try {
      latestText = await locator.innerText({
        timeout: 1_000
      });

      if (latestText.includes(expectedText)) {
        return latestText;
      }
    } catch {
      // Retry while the UI settles.
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for UI text "${expectedText}". Latest text: ${latestText}`);
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, STAGE_HOST, () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not allocate an open port."));
          return;
        }

        resolve(address.port);
      });
    });
  });
}

function stopChildProcess(childProcess) {
  if (!childProcess || childProcess.killed) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 2_000);

    childProcess.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    childProcess.kill("SIGTERM");
  });
}

function summarizeProcessLogs(logs) {
  return logs.join("").split("\n").slice(-8).join(" ");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function slugifyTimestamp(value) {
  return value.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-+|-+$/g, "");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(createSafeRealtimeSmokeErrorMessage(error));
    process.exit(1);
  });
}
