import { expect, test } from "@playwright/test";

const brokerRoute = "http://127.0.0.1:8798/api/blackstage/realtime/session";

test("Stage Web bridges live Realtime SDP only when explicitly configured", async ({ page }) => {
  test.setTimeout(90_000);

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
    window.localStorage.setItem("blackstage.realtime.approvalPhrase", "approve-local-realtime");
    window.localStorage.setItem("blackstage.realtimeBroker.url", "http://127.0.0.1:8798");
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

  await page.route(brokerRoute, async (route) => {
    const request = route.request();
    const method = request.method();
    const body = method === "POST" ? request.postData() ?? "" : undefined;

    brokerRequests.push({
      method,
      body,
      approval: request.headers()["x-blackstage-realtime-approval"]
    });

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          route: "/api/blackstage/realtime/session",
          liveModeEnabled: true,
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
  });

  await page.goto("/");

  await expect(page.getByTestId("realtime-broker-status")).toContainText("live SDP");

  const bridgeEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              agent_name?: string;
              summary?: string;
            };
          }>;
        })
      : undefined;

    return (
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "agent_event" &&
          event.payload?.agent_name === "Realtime voice broker" &&
          event.payload?.summary === "Realtime SDP bridge connected."
      ) ?? false
    );
  });

  expect(bridgeEvidence).toBe(true);
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
