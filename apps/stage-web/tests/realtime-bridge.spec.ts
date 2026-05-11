import { expect, test } from "@playwright/test";

const brokerProofsRoute = "http://127.0.0.1:8798/api/blackstage/realtime/proofs";

test("Stage Web bridges live Realtime SDP only after visible approval", async ({
  page
}) => {
  test.setTimeout(240_000);

  const brokerRequests: Array<{
    method: string;
    approval?: string;
    body?: string;
  }> = [];

  await page.addInitScript(() => {
    const browserWindow = window as Window & {
      __blackstageRealtimeApprovalPhrase?: string;
      __blackstageRealtimeBrokerUrl?: string;
      __blackstageRealtimeWebrtcEnabled?: string;
    };

    browserWindow.__blackstageRealtimeApprovalPhrase = "approve-local-realtime";
    browserWindow.__blackstageRealtimeBrokerUrl = "http://127.0.0.1:8798";
    browserWindow.__blackstageRealtimeWebrtcEnabled = "1";
    window.localStorage.setItem(
      "blackstage.realtime.approvalPhrase",
      "approve-local-realtime"
    );
    window.localStorage.setItem(
      "blackstage.realtimeBroker.url",
      "http://127.0.0.1:8798"
    );
    window.localStorage.setItem("blackstage.realtimeWebrtc.enabled", "1");

    class FakeRTCPeerConnection {
      createDataChannel(label: "oai-events") {
        return {
          label,
          addEventListener() {}
        };
      }

      async createOffer() {
        return {
          type: "offer",
          sdp: "v=0\r\no=- blackstage-playwright-offer\r\n"
        };
      }

      async setLocalDescription() {}

      async setRemoteDescription() {}

      close() {}
    }

    Object.defineProperty(window, "RTCPeerConnection", {
      configurable: true,
      value: FakeRTCPeerConnection
    });
  });

  await page.route(
    "http://127.0.0.1:8798/api/blackstage/realtime/**",
    async (route) => {
      const request = route.request();
      const method = request.method();
      const requestUrl = new URL(request.url());
      const body = method === "POST" ? (request.postData() ?? "") : undefined;

      brokerRequests.push({
        method,
        body,
        approval: request.headers()["x-blackstage-realtime-approval"]
      });

      if (requestUrl.href === brokerProofsRoute) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            route: "/api/blackstage/realtime/proofs",
            proofRoot: ".blackstage/realtime-smoke",
            proofs: [
              {
                proofVersion: 1,
                kind: "blackstage.realtime.live_smoke",
                status: "skipped",
                proofPath: ".blackstage/realtime-smoke/skip-proof.json",
                createdAt: "2026-05-11T10:00:00.000Z",
                liveSmokeArmed: false,
                openAiNetworkCallAttempted: false,
                browserReceivesStandardApiKey: false,
                browserSendsAudio: false,
                missingEnv: ["BLACKSTAGE_REALTIME_RUN_APPROVAL_TOKEN"]
              }
            ]
          })
        });
        return;
      }

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            route: "/api/blackstage/realtime/session",
            liveModeEnabled: true,
            liveApprovalRequired: true,
            liveApprovalConfigured: true,
            accepts: "application/sdp",
            browserSendsAudio: false,
            browserReceivesStandardApiKey: false,
            checkedAt: "2026-05-10T00:00:00.000Z"
          })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/sdp",
        body: "v=0\r\no=- blackstage-playwright-answer\r\n"
      });
    }
  );

  await page.goto("/");

  await expect(page.getByTestId("realtime-broker-status")).toContainText(
    "live broker · SDP off"
  );
  await expect(page.getByTestId("realtime-broker-status")).toContainText("1 proof");
  await expect(page.getByTestId("realtime-arm-button")).toHaveText("Arm live");
  await expect(page.getByTestId("realtime-arm-button")).toBeEnabled();
  expect(brokerRequests.filter((request) => request.method === "POST")).toHaveLength(0);

  await page.getByTestId("realtime-arm-button").click({ force: true });
  await expect(page.getByTestId("approval-card")).toContainText(
    "Open live Realtime voice edge"
  );
  await expect(page.getByTestId("approval-card")).toContainText("network access");
  await page.getByRole("button", { name: "Approve" }).click({ force: true });
  await expect(page.getByTestId("realtime-broker-status")).toContainText("live SDP");

  const bridgeEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              action_type?: string;
              agent_name?: string;
              approval_id?: string;
              summary?: string;
            };
          }>;
        })
      : undefined;

    const events = snapshot?.researchEvents ?? [];

    return {
      bridgeConnected: events.some(
        (event) =>
          event.eventType === "agent_event" &&
          event.payload?.agent_name === "Realtime voice broker" &&
          event.payload?.summary === "Realtime SDP bridge connected."
      ),
      approvalRequested: events.some(
        (event) =>
          event.eventType === "approval_requested" &&
          event.payload?.action_type === "network_access" &&
          event.payload?.approval_id?.startsWith("approval_realtime_live_")
      )
    };
  });

  expect(bridgeEvidence.bridgeConnected).toBe(true);
  expect(bridgeEvidence.approvalRequested).toBe(true);
  expect(brokerRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        method: "GET"
      }),
      expect.objectContaining({
        method: "POST",
        approval: "approve-local-realtime",
        body: "v=0\r\no=- blackstage-playwright-offer\r\n"
      })
    ])
  );
});
