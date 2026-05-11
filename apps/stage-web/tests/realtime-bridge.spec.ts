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
      __blackstageTestDelayMultiplier?: number;
      __blackstageClosedPeerConnections?: number;
      __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      __blackstageGetUserMediaCalls?: number;
      __blackstageRealtimeTransceivers?: string[];
    };

    browserWindow.__blackstageRealtimeApprovalPhrase = "approve-local-realtime";
    browserWindow.__blackstageRealtimeAudioEnabled = "0";
    browserWindow.__blackstageRealtimeBrokerUrl = "http://127.0.0.1:8798";
    browserWindow.__blackstageRealtimeWebrtcEnabled = "1";
    browserWindow.__blackstageTestDelayMultiplier = 0.1;
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
  await expect(page.getByTestId("presence-orb")).toHaveAccessibleName(
    "Start voice input"
  );
  expect(brokerRequests.filter((request) => request.method === "POST")).toHaveLength(0);

  await page.getByTestId("presence-orb").click({ force: true });
  await expect(page.getByTestId("approval-card")).toContainText(
    "Open live Realtime voice edge"
  );
  await expect(page.getByTestId("approval-card")).toContainText("network access");
  await page.getByRole("button", { name: "Approve" }).click({ force: true });
  await expect(page.getByTestId("realtime-broker-status")).toContainText("live SDP");
  await expect(page.getByTestId("stage-shell")).toHaveClass(/stage-listening/);
  await expect(page.getByTestId("stage-presence")).toContainText("Listening");
  await expect(page.getByTestId("stage-presence")).toContainText("Speak when ready");
  await expect(page.getByTestId("presence-orb")).toHaveAccessibleName(
    "Listening for intent"
  );

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
      type: "session.created"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime session created."
  );
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "response.created"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime response started."
  );
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "response.done"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime response completed."
  );
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "rate_limits.updated",
      ignoredPayload: "do-not-store-this-payload"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime server event observed."
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "rate_limits.updated"
  );
  const unmappedEventEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          stageEvents?: Array<{
            payload?: {
              details?: string;
              summary?: string;
            };
            type?: string;
          }>;
        })
      : undefined;

    return (snapshot?.stageEvents ?? []).some(
      (event) =>
        event.type === "agent.progress" &&
        event.payload?.summary === "Realtime server event observed." &&
        event.payload?.details?.includes("rate_limits.updated") &&
        event.payload.details.includes("Payload was not stored") &&
        !event.payload.details.includes("do-not-store-this-payload")
    );
  });

  expect(unmappedEventEvidence).toBe(true);
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
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "input_audio_buffer.speech_started"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime voice capture started."
  );
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "input_audio_buffer.speech_stopped"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime voice capture stopped."
  );

  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "response.output_text.done",
      text: "I can prepare the live proof object next."
    });
  });
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "I can prepare the live proof object next."
  );
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
        const snapshot = rawSnapshot
          ? (JSON.parse(rawSnapshot) as {
              stageEvents?: Array<{
                payload?: {
                  source?: string;
                  text?: string;
                };
                type?: string;
              }>;
            })
          : undefined;

        return (snapshot?.stageEvents ?? []).some(
          (event) =>
            event.type === "assistant.speech" &&
            event.payload?.source === "stage_status" &&
            event.payload?.text === "I can prepare the live proof object next."
        );
      })
    )
    .toBe(true);

  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "output_audio_buffer.started"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime assistant audio started."
  );
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "output_audio_buffer.stopped"
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime assistant audio stopped."
  );

  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "response.function_call_arguments.done",
      call_id: "call_realtime_prepare_action",
      name: "blackstage.prepare_external_action"
    });
  });
  await expect(page.getByTestId("approval-card")).toContainText(
    "Approve realtime tool: blackstage.prepare_external_action"
  );
  await expect(page.getByTestId("approval-card")).toContainText("tool call");

  const toolApprovalEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          stageEvents?: Array<{
            payload?: {
              actionType?: string;
              proposedBy?: string;
              status?: string;
              title?: string;
            };
            type?: string;
          }>;
        })
      : undefined;

    return (snapshot?.stageEvents ?? []).some(
      (event) =>
        event.type === "approval.requested" &&
        event.payload?.actionType === "tool_call" &&
        event.payload?.proposedBy === "Realtime voice broker" &&
        event.payload?.status === "pending" &&
        event.payload?.title ===
          "Approve realtime tool: blackstage.prepare_external_action"
    );
  });

  expect(toolApprovalEvidence).toBe(true);
  expect(brokerRequests.filter((request) => request.method === "POST")).toHaveLength(1);
  await page.evaluate(() => {
    (
      window as Window & {
        __blackstageEmitRealtimeServerEvent?: (payload: unknown) => void;
      }
    ).__blackstageEmitRealtimeServerEvent?.({
      type: "error",
      error: {
        message: "Realtime data channel test error."
      }
    });
  });
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime voice error."
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime data channel test error."
  );
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
  const realtimeArmButton = page.getByTestId("realtime-arm-button");

  await realtimeArmButton.focus();
  await expect(page.getByTestId("intent-capture")).toHaveCSS("pointer-events", "auto");
  await realtimeArmButton.click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Open live Realtime voice edge"
  );
  await page.getByRole("button", { name: "Approve" }).click({ force: true });
  await expect(page.getByTestId("realtime-broker-status")).toContainText("live SDP");
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Realtime microphone stream attached."
  );

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
      ),
      audioTrackVisible: (snapshot?.stageEvents ?? []).some(
        (event) =>
          event.type === "agent.progress" &&
          event.payload?.summary === "Realtime microphone stream attached." &&
          event.payload?.details?.includes("Stage approval")
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
  expect(audioEvidence.audioTrackVisible).toBe(true);
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
