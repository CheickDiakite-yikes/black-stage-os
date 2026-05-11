import { expect, test } from "@playwright/test";

const harnessRoute = "http://127.0.0.1:8797/api/blackstage/harness";

const workflowPolicy = {
  source: "WORKFLOW.md",
  version: "blackstage.workflow.v0",
  controlPlane: "symphony_style_internal_queue",
  codingWorker: "openai_codex",
  codexTransports: ["cli", "app_server"],
  agentWorker: "openai_agents_sdk_manager",
  voiceModel: "gpt-realtime-2",
  agentMemoryAccessDefault: "stage_approval_required",
  workspaceRoot: ".blackstage/workspaces",
  browserMutationAllowed: false,
  browserReceivesProviderCredentials: false,
  liveExecutionDefault: "disabled",
  humanApprovalRequiredForHighImpactActions: true,
  humanReviewRequired: true,
  proofPacketRequired: true
};

test("Stage Web renders the active harness workflow policy", async ({ page }) => {
  await page.addInitScript((routeUrl) => {
    const browserWindow = window as Window & {
      __blackstageHarnessRunnerUrl?: string;
      __blackstageTestDelayMultiplier?: number;
    };

    localStorage.clear();
    browserWindow.__blackstageHarnessRunnerUrl = routeUrl;
    browserWindow.__blackstageTestDelayMultiplier = 0.25;
  }, harnessRoute);

  await page.route(`${harnessRoute}**`, async (route) => {
    const requestUrl = new URL(route.request().url());
    const jsonHeaders = {
      "access-control-allow-origin": "*",
      "content-type": "application/json"
    };

    if (requestUrl.pathname.endsWith("/snapshot")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          ok: true,
          checkedAt: "2026-05-11T06:40:00.000Z",
          snapshot: {
            tasks: [],
            runs: [],
            events: []
          },
          controlPlane: {
            kind: "blackstage_internal_queue",
            workflowPolicy,
            workItems: [],
            openWorkCount: 0,
            reviewCount: 0,
            blockedCount: 0
          }
        })
      });
      return;
    }

    if (requestUrl.pathname.endsWith("/proofs")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          ok: true,
          checkedAt: "2026-05-11T06:40:00.000Z",
          proofs: []
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        ok: true,
        route: "/api/blackstage/harness",
        orchestration: "symphony_style_internal_queue",
        codexMode: "dry_run",
        codexTransport: "cli",
        agentsSdkMode: "dry_run",
        workflowPolicy,
        localCodexSubprocessEnabled: false,
        browserCanEnqueueWork: false,
        browserCanRunCodex: false,
        browserReceivesProviderCredentials: false,
        checkedAt: "2026-05-11T06:40:00.000Z"
      })
    });
  });

  await page.goto("/");

  const harnessStatus = page.getByTestId("harness-runner-status");

  await expect(harnessStatus).toContainText("0 open");
  await expect(harnessStatus).toContainText("WORKFLOW.md");
  await expect(harnessStatus).toContainText("Symphony queue");
  await expect(harnessStatus).toContainText("Codex CLI/App Server");
  await expect(harnessStatus).toContainText("Agents SDK manager");
  await expect(harnessStatus).toContainText("Memory approvals");
  await expect(harnessStatus).toContainText("gpt-realtime-2");
});
