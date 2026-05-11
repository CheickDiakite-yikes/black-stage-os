/* global fetch, Response */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
  OPENAI_REALTIME_CALLS_URL,
  STAGE_BROKER_APPROVAL_HEADER,
  STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR,
  createOpenAiRealtimeExchange,
  createStageBrokerRuntimeConfig,
  createStageBrokerServer
} from "../dist/index.js";

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe("Stage broker server", () => {
  it("exposes safe readiness without audio, SDP, or browser credentials", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          origin: "http://127.0.0.1:4187"
        }
      }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://127.0.0.1:4187"
    );
    assert.equal(body.ok, true);
    assert.equal(body.route, BLACKSTAGE_REALTIME_BROKER_ROUTE);
    assert.equal(body.liveModeEnabled, false);
    assert.equal(body.liveApprovalRequired, false);
    assert.equal(body.liveApprovalConfigured, false);
    assert.equal(body.accepts, "application/sdp");
    assert.equal(body.browserSendsAudio, false);
    assert.equal(body.browserReceivesStandardApiKey, false);
  });

  it("answers local preflight requests without opening a realtime session", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "OPTIONS",
        headers: {
          origin: "http://127.0.0.1:4187",
          "access-control-request-method": "POST"
        }
      }
    );

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://127.0.0.1:4187"
    );
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
  });

  it("reports whether live broker approval is configured", async () => {
    const server = await listen(
      createStageBrokerServer({
        runtimeConfig: createStageBrokerRuntimeConfig({
          OPENAI_API_KEY: "test-key",
          BLACKSTAGE_REALTIME_LIVE: "1",
          BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: "hashed-user-id",
          [STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR]: "approve-local-realtime"
        })
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "GET",
        headers: {
          accept: "application/json"
        }
      }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.liveModeEnabled, true);
    assert.equal(body.liveApprovalRequired, true);
    assert.equal(body.liveApprovalConfigured, true);
    assert.equal(body.browserReceivesStandardApiKey, false);
  });

  it("mounts the realtime broker route disabled by default", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/sdp"
        },
        body: "v=0\r\n"
      }
    );
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.ok(body.errors.some((error) => error.includes("disabled by default")));
  });

  it("rejects non-SDP requests at the mounted route", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: "{}"
      }
    );

    assert.equal(response.status, 415);
    assert.equal(response.headers.get("content-type"), "application/json");
  });

  it("exchanges SDP only through an injected live handler", async () => {
    const testRouteCredential = ["stage", "broker", "credential"].join("-");
    const approvalPhrase = "approve-local-realtime";
    let exchangeCalls = 0;
    const server = await listen(
      createStageBrokerServer({
        runtimeConfig: createStageBrokerRuntimeConfig({
          OPENAI_API_KEY: testRouteCredential,
          BLACKSTAGE_REALTIME_LIVE: "1",
          BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: "hashed-user-id",
          [STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalPhrase
        }),
        exchangeWithOpenAi: async (openAiRequest, exchangeContext) => {
          exchangeCalls += 1;
          assert.equal(exchangeContext.apiKey, testRouteCredential);
          assert.equal(openAiRequest.body.sdp, "v=0\r\no=- stage-broker-offer\r\n");

          return {
            answerSdp: "v=0\r\no=- stage-broker-answer\r\n"
          };
        }
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/sdp",
          [STAGE_BROKER_APPROVAL_HEADER]: approvalPhrase
        },
        body: "v=0\r\no=- stage-broker-offer\r\n"
      }
    );
    const text = await response.text();

    assert.equal(exchangeCalls, 1);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/sdp");
    assert.equal(text, "v=0\r\no=- stage-broker-answer\r\n");
    assert.doesNotMatch(text, new RegExp(testRouteCredential));
  });

  it("requires explicit local approval before live broker exchange", async () => {
    const testRouteCredential = ["stage", "broker", "credential"].join("-");
    let exchangeCalls = 0;
    const server = await listen(
      createStageBrokerServer({
        runtimeConfig: createStageBrokerRuntimeConfig({
          OPENAI_API_KEY: testRouteCredential,
          BLACKSTAGE_REALTIME_LIVE: "1",
          BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: "hashed-user-id"
        }),
        exchangeWithOpenAi: async () => {
          exchangeCalls += 1;
          return {
            answerSdp: "should-not-run"
          };
        }
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/sdp"
        },
        body: "v=0\r\no=- stage-broker-offer\r\n"
      }
    );
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(exchangeCalls, 0);
    assert.match(body.errors[0], /matching local approval token/);
  });

  it("adapts live broker requests to the OpenAI Realtime calls endpoint", async () => {
    const dummyApiKey = ["test", "api", "credential"].join("-");
    const exchange = createOpenAiRealtimeExchange(async (url, init) => {
      assert.equal(url, OPENAI_REALTIME_CALLS_URL);
      assert.equal(init.method, "POST");
      assert.equal(init.headers.authorization, `Bearer ${dummyApiKey}`);
      assert.equal(init.headers["openai-safety-identifier"], "hashed-user-id");
      assert.equal(init.body.get("sdp"), "v=0\r\no=- stage-broker-offer\r\n");

      const session = JSON.parse(init.body.get("session"));
      assert.equal(session.type, "realtime");
      assert.equal(session.model, "gpt-realtime-2");
      assert.equal(session.audio.output.voice, "marin");
      assert.equal(session.metadata.blackstageThreadId, "thread_stage_broker");

      return new Response("v=0\r\no=- stage-broker-answer\r\n", {
        status: 200,
        headers: {
          "x-openai-request-id": "req_stage_broker"
        }
      });
    });
    const result = await exchange(
      {
        method: "POST",
        endpointPath: "/v1/realtime/calls",
        authorization: {
          source: "server_environment",
          envVar: "OPENAI_API_KEY",
          exposedToBrowser: false
        },
        safetyIdentifier: "hashed-user-id",
        body: {
          kind: "multipart_form_data",
          sdp: "v=0\r\no=- stage-broker-offer\r\n",
          session: {
            type: "realtime",
            model: "gpt-realtime-2",
            instructions: "Listen for intent.",
            audio: {
              output: {
                voice: "marin"
              }
            },
            reasoning: {
              effort: "medium"
            },
            metadata: {
              blackstageSessionId: "stage_broker_local",
              blackstageThreadId: "thread_stage_broker"
            }
          }
        }
      },
      {
        apiKey: dummyApiKey
      }
    );

    assert.equal(result.answerSdp, "v=0\r\no=- stage-broker-answer\r\n");
    assert.equal(result.responseHeaders["x-openai-request-id"], "req_stage_broker");
  });

  it("returns a safe failure when the live OpenAI exchange fails", async () => {
    const dummyApiKey = ["test", "api", "credential"].join("-");
    const approvalPhrase = "approve-local-realtime";
    const server = await listen(
      createStageBrokerServer({
        runtimeConfig: createStageBrokerRuntimeConfig({
          OPENAI_API_KEY: dummyApiKey,
          BLACKSTAGE_REALTIME_LIVE: "1",
          BLACKSTAGE_REALTIME_SAFETY_IDENTIFIER: "hashed-user-id",
          [STAGE_BROKER_RUN_APPROVAL_TOKEN_ENV_VAR]: approvalPhrase
        }),
        exchangeWithOpenAi: async () => {
          throw new Error("upstream failed with secret-ish detail");
        }
      })
    );
    const response = await fetch(
      `${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/sdp",
          [STAGE_BROKER_APPROVAL_HEADER]: approvalPhrase
        },
        body: "v=0\r\no=- stage-broker-offer\r\n"
      }
    );
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(
      body.errors[0],
      "Realtime broker exchange failed before returning an SDP answer."
    );
    assert.doesNotMatch(JSON.stringify(body), /secret-ish/);
  });
});

async function listen(server) {
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  servers.push(server);

  return server;
}

function baseUrl(server) {
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected local TCP test server.");
  }

  return `http://127.0.0.1:${address.port}`;
}
