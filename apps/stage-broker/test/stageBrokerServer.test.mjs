/* global fetch */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  BLACKSTAGE_REALTIME_BROKER_ROUTE,
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
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        origin: "http://127.0.0.1:4187"
      }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:4187");
    assert.equal(body.ok, true);
    assert.equal(body.route, BLACKSTAGE_REALTIME_BROKER_ROUTE);
    assert.equal(body.liveModeEnabled, false);
    assert.equal(body.accepts, "application/sdp");
    assert.equal(body.browserSendsAudio, false);
    assert.equal(body.browserReceivesStandardApiKey, false);
  });

  it("answers local preflight requests without opening a realtime session", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`, {
      method: "OPTIONS",
      headers: {
        origin: "http://127.0.0.1:4187",
        "access-control-request-method": "POST"
      }
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:4187");
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
  });

  it("mounts the realtime broker route disabled by default", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`, {
      method: "POST",
      headers: {
        "content-type": "application/sdp"
      },
      body: "v=0\r\n"
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.ok(body.errors.some((error) => error.includes("disabled by default")));
  });

  it("rejects non-SDP requests at the mounted route", async () => {
    const server = await listen(createStageBrokerServer());
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{}"
    });

    assert.equal(response.status, 415);
    assert.equal(response.headers.get("content-type"), "application/json");
  });

  it("exchanges SDP only through an injected live handler", async () => {
    const testRouteCredential = ["stage", "broker", "credential"].join("-");
    let exchangeCalls = 0;
    const server = await listen(
      createStageBrokerServer({
        runtimeConfig: {
          environment: {
            liveModeEnabled: true,
            openAiApiKey: testRouteCredential,
            safetyIdentifier: "hashed-user-id"
          }
        },
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
    const response = await fetch(`${baseUrl(server)}${BLACKSTAGE_REALTIME_BROKER_ROUTE}`, {
      method: "POST",
      headers: {
        "content-type": "application/sdp"
      },
      body: "v=0\r\no=- stage-broker-offer\r\n"
    });
    const text = await response.text();

    assert.equal(exchangeCalls, 1);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/sdp");
    assert.equal(text, "v=0\r\no=- stage-broker-answer\r\n");
    assert.doesNotMatch(text, new RegExp(testRouteCredential));
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
