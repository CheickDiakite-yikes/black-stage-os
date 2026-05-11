import { expect, test } from "@playwright/test";

const brokerProofsRoute = "http://127.0.0.1:8798/api/blackstage/realtime/proofs";

test("Stage Web bridges live Realtime SDP only after visible approval", async ({
  page
}) => {
  test.setTimeout(240_000);
  const corsHeaders = {
    "access-control-allow-headers": "content-type, x-blackstage-realtime-approval",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": "*"
  };

  const brokerRequests: Array<{
    method: string;
    approval?: string;
    body?: string;
  }> = [];

  await page.addInitScript(() => {
    const browserWindow = window as Window & {
      __blackstageRealtimeApprovalPhrase?: string;
      __blackstageRealtimeAudioEnabled?: string;
      __blackstageRealtimeBrokerUrl?: string;
      __blackstageRealtimeWebrtcEnabled?: string;
      __blackstageClosedPeerConnections?: number;
      __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      __blackstageGetUserMediaCalls?: number;
      __blackstageRealtimeTransceivers?: string[];
    };

    browserWindow.__blackstageRealtimeApprovalPhrase = "approve-local-realtime";
    browserWindow.__blackstageRealtimeAudioEnabled = "0";
    browserWindow.__blackstageRealtimeBrokerUrl = "http://127.0.0.1:8798";
    browserWindow.__blackstageRealtimeWebrtcEnabled = "1";
    browserWindow.__blackstageClosedPeerConnections = 0;
    browserWindow.__blackstageGetUserMediaCalls = 0;
    browserWindow.__blackstageRealtimeTransceivers = [];
    window.localStorage.removeItem("blackstage.realtimeAudio.enabled");
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
      addTransceiver(kind: "audio", init: { direction: "recvonly" }) {
        browserWindow.__blackstageRealtimeTransceivers?.push(
          `${kind}:${init.direction}`
        );
      }

      createDataChannel(label: "oai-events") {
        return {
          label,
          addEventListener(
            eventName: "message",
            handler: (event: { data: string }) => void
          ) {
            if (eventName === "message") {
              browserWindow.__blackstageEmitRealtimeServerEvent = (payload) => {
                handler({
                  data: typeof payload === "string" ? payload : JSON.stringify(payload)
                });
              };
            }
          }
        };
      }

      async createOffer() {
        return {
          type: "offer",
          sdp: [
            "v=0",
            "m=audio 9 UDP/TLS/RTP/SAVPF 111",
            "a=recvonly",
            "m=application 9 UDP/DTLS/SCTP webrtc-datachannel"
          ].join("\r\n")
        };
      }

      async setLocalDescription() {}

      async setRemoteDescription() {}

      close() {
        browserWindow.__blackstageClosedPeerConnections =
          (browserWindow.__blackstageClosedPeerConnections ?? 0) + 1;
      }
    }

    Object.defineProperty(window, "RTCPeerConnection", {
      configurable: true,
      value: FakeRTCPeerConnection
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia() {
          browserWindow.__blackstageGetUserMediaCalls =
            (browserWindow.__blackstageGetUserMediaCalls ?? 0) + 1;

          return Promise.reject(new Error("getUserMedia should not run in preflight"));
        }
      }
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        async query(descriptor: { name: string }) {
          return {
            state: descriptor.name === "microphone" ? "prompt" : "denied"
          };
        }
      }
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

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: corsHeaders
        });
        return;
      }

      if (requestUrl.href === brokerProofsRoute) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            route: "/api/blackstage/realtime/proofs",
            proofRoot: ".blackstage/realtime-smoke",
            proofs: [
              {
                proofVersion: 1,
                kind: "blackstage.realtime.live_smoke",
                status: "passed",
                proofPath: ".blackstage/realtime-smoke/live-proof.json",
                createdAt: "2026-05-11T10:00:00.000Z",
                liveSmokeArmed: true,
                openAiNetworkCallAttempted: true,
                browserReceivesStandardApiKey: false,
                browserSendsAudio: false,
                cheapTestGuard: {
                  offerMode: "data_channel_plus_recvonly_audio",
                  rejectsBrowserAudioSend: true,
                  maxProviderRequests: 1,
                  effectiveTimeoutMs: 15000,
                  offer: {
                    audioDirections: ["recvonly"],
                    hasAudioSendMediaSection: false,
                    hasDataChannelMediaSection: true
                  }
                },
                missingEnv: []
              }
            ]
          })
        });
        return;
      }

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
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
        headers: corsHeaders,
        contentType: "application/sdp",
        body: "v=0\r\no=- blackstage-playwright-answer\r\n"
      });
    }
  );

  await page.goto("/", {
    waitUntil: "domcontentloaded"
  });

  await expect(page.getByTestId("realtime-broker-status")).toContainText(
    "live broker · SDP off"
  );
  await expect(page.getByTestId("realtime-broker-status")).toContainText(
    "passed proof"
  );
  await expect(page.getByTestId("realtime-broker-status")).toContainText("network");
  await expect(page.getByTestId("realtime-broker-status")).toContainText("no mic send");
  await expect(page.getByTestId("realtime-broker-status")).toContainText("recvonly");
  await expect(page.getByTestId("realtime-mic-preflight")).toContainText("mic gesture");
  await expect(page.getByTestId("realtime-mic-preflight")).toContainText("no stream");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
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
    const browserWindow = window as Window & {
      __blackstageClosedPeerConnections?: number;
      __blackstageRealtimeTransceivers?: string[];
    };

    const events = snapshot?.researchEvents ?? [];

    return {
      closedConnections: browserWindow.__blackstageClosedPeerConnections ?? 0,
      transceivers: browserWindow.__blackstageRealtimeTransceivers ?? [],
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
  expect(bridgeEvidence.closedConnections).toBe(0);
  expect(bridgeEvidence.transceivers).toEqual(["audio:recvonly"]);
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "conversation.item.input_audio_transcription.completed",
      transcript: "Draft the live session proof object."
    });
  });
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
        const snapshot = rawSnapshot
          ? (JSON.parse(rawSnapshot) as {
              stageEvents?: Array<{
                payload?: {
                  rawText?: string;
                };
                type?: string;
              }>;
            })
          : undefined;

        return (snapshot?.stageEvents ?? []).some(
          (event) =>
            event.type === "intent.submitted" &&
            event.payload?.rawText === "Draft the live session proof object."
        );
      })
    )
    .toBe(true);
  await expect(page.getByTestId("realtime-mic-preflight")).toContainText("no stream");
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as Window & { __blackstageGetUserMediaCalls?: number })
            .__blackstageGetUserMediaCalls ?? 0
      )
    )
    .toBe(0);
  expect(brokerRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        method: "GET"
      }),
      expect.objectContaining({
        method: "POST",
        approval: "approve-local-realtime",
        body: [
          "v=0",
          "m=audio 9 UDP/TLS/RTP/SAVPF 111",
          "a=recvonly",
          "m=application 9 UDP/DTLS/SCTP webrtc-datachannel"
        ].join("\r\n")
      })
    ])
  );
  await page.getByRole("button", { name: "Reset" }).click({ force: true });
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as Window & { __blackstageClosedPeerConnections?: number })
            .__blackstageClosedPeerConnections ?? 0
      )
    )
    .toBe(1);
});

test("Stage Web attaches local audio only after Realtime approval and ready mic preflight", async ({
  page
}) => {
  test.setTimeout(240_000);
  const corsHeaders = {
    "access-control-allow-headers": "content-type, x-blackstage-realtime-approval",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": "*"
  };

  const brokerRequests: Array<{
    method: string;
    approval?: string;
    body?: string;
  }> = [];

  await page.addInitScript(() => {
    const browserWindow = window as Window & {
      __blackstageRealtimeApprovalPhrase?: string;
      __blackstageRealtimeAudioEnabled?: string;
      __blackstageRealtimeBrokerUrl?: string;
      __blackstageRealtimeWebrtcEnabled?: string;
      __blackstageAttachedAudioTracks?: string[];
      __blackstageGetUserMediaCalls?: number;
      __blackstageGetUserMediaConstraints?: unknown[];
    };

    browserWindow.__blackstageRealtimeApprovalPhrase = "approve-local-realtime";
    browserWindow.__blackstageRealtimeAudioEnabled = "1";
    browserWindow.__blackstageRealtimeBrokerUrl = "http://127.0.0.1:8798";
    browserWindow.__blackstageRealtimeWebrtcEnabled = "1";
    browserWindow.__blackstageAttachedAudioTracks = [];
    browserWindow.__blackstageGetUserMediaCalls = 0;
    browserWindow.__blackstageGetUserMediaConstraints = [];
    window.localStorage.setItem(
      "blackstage.realtime.approvalPhrase",
      "approve-local-realtime"
    );
    window.localStorage.setItem("blackstage.realtimeAudio.enabled", "1");
    window.localStorage.setItem(
      "blackstage.realtimeBroker.url",
      "http://127.0.0.1:8798"
    );
    window.localStorage.setItem("blackstage.realtimeWebrtc.enabled", "1");

    class FakeRTCPeerConnection {
      addTrack(track: { id?: string; kind?: string }) {
        browserWindow.__blackstageAttachedAudioTracks?.push(
          `${track.kind}:${track.id}`
        );
      }

      createDataChannel(label: "oai-events") {
        return {
          label,
          addEventListener() {}
        };
      }

      async createOffer() {
        return {
          type: "offer",
          sdp: "v=0\r\no=- blackstage-playwright-audio-offer\r\n"
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
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia(constraints: unknown) {
          browserWindow.__blackstageGetUserMediaCalls =
            (browserWindow.__blackstageGetUserMediaCalls ?? 0) + 1;
          browserWindow.__blackstageGetUserMediaConstraints?.push(constraints);

          return {
            getAudioTracks() {
              return [
                {
                  enabled: true,
                  id: "fake_audio_track",
                  kind: "audio"
                }
              ];
            }
          };
        }
      }
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        async query(descriptor: { name: string }) {
          return {
            state: descriptor.name === "microphone" ? "granted" : "denied"
          };
        }
      }
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

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: corsHeaders
        });
        return;
      }

      if (requestUrl.href === brokerProofsRoute) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            route: "/api/blackstage/realtime/proofs",
            proofRoot: ".blackstage/realtime-smoke",
            proofs: []
          })
        });
        return;
      }

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
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
        headers: corsHeaders,
        contentType: "application/sdp",
        body: "v=0\r\no=- blackstage-playwright-audio-answer\r\n"
      });
    }
  );

  await page.goto("/", {
    waitUntil: "domcontentloaded"
  });

  await expect(page.getByTestId("realtime-mic-preflight")).toContainText("mic gesture");
  await page.getByTestId("realtime-arm-button").click({ force: true });
  await expect(page.getByTestId("approval-card")).toContainText(
    "Open live Realtime voice edge"
  );
  await page.getByRole("button", { name: "Approve" }).click({ force: true });
  await expect(page.getByTestId("realtime-broker-status")).toContainText("live SDP");

  const audioEvidence = await page.evaluate(() => {
    const browserWindow = window as Window & {
      __blackstageAttachedAudioTracks?: string[];
      __blackstageGetUserMediaCalls?: number;
      __blackstageGetUserMediaConstraints?: unknown[];
    };
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          stageEvents?: Array<{
            type?: string;
            payload?: {
              details?: string;
              summary?: string;
            };
          }>;
        })
      : undefined;

    return {
      attachedTracks: browserWindow.__blackstageAttachedAudioTracks ?? [],
      constraints: browserWindow.__blackstageGetUserMediaConstraints ?? [],
      getUserMediaCalls: browserWindow.__blackstageGetUserMediaCalls ?? 0,
      audioBridgeConnected: (snapshot?.stageEvents ?? []).some(
        (event) =>
          event.type === "agent.progress" &&
          event.payload?.summary === "Realtime SDP bridge connected." &&
          event.payload?.details?.includes("approved local audio track")
      )
    };
  });

  expect(audioEvidence.getUserMediaCalls).toBe(1);
  expect(audioEvidence.constraints).toEqual([
    {
      audio: true,
      video: false
    }
  ]);
  expect(audioEvidence.attachedTracks).toEqual(["audio:fake_audio_track"]);
  expect(audioEvidence.audioBridgeConnected).toBe(true);
  expect(brokerRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        method: "POST",
        approval: "approve-local-realtime",
        body: "v=0\r\no=- blackstage-playwright-audio-offer\r\n"
      })
    ])
  );
});
