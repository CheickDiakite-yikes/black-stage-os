import { expect, test } from "@playwright/test";

const harnessRoute = "http://127.0.0.1:8797/api/blackstage/harness";

const upstreamIntegrations = [
  {
    id: "openai_codex_cli",
    sourceKind: "official_docs",
    sourceUrl: "https://developers.openai.com/codex/cli",
    openSourceUrl: "https://github.com/openai/codex",
    blackstageRole: "coding_worker_cli",
    liveDefault: "disabled",
    browserMutationAllowed: false,
    browserReceivesProviderCredentials: false,
    highImpactApprovalRequired: true
  },
  {
    id: "openai_codex_app_server",
    sourceKind: "official_docs",
    sourceUrl: "https://developers.openai.com/codex/app-server/",
    blackstageRole: "coding_worker_app_server",
    liveDefault: "disabled",
    browserMutationAllowed: false,
    browserReceivesProviderCredentials: false,
    highImpactApprovalRequired: true
  },
  {
    id: "openai_agents_sdk",
    sourceKind: "official_docs",
    sourceUrl: "https://developers.openai.com/api/docs/guides/agents",
    blackstageRole: "agent_manager_runtime",
    liveDefault: "dry_run",
    browserMutationAllowed: false,
    browserReceivesProviderCredentials: false,
    highImpactApprovalRequired: true
  },
  {
    id: "openai_symphony",
    sourceKind: "official_open_source_reference",
    sourceUrl: "https://openai.com/index/open-source-codex-orchestration-symphony/",
    openSourceUrl: "https://github.com/openai/symphony",
    blackstageRole: "orchestration_control_plane_pattern",
    liveDefault: "dry_run",
    browserMutationAllowed: false,
    browserReceivesProviderCredentials: false,
    highImpactApprovalRequired: true
  },
  {
    id: "openai_realtime_voice",
    sourceKind: "official_model_docs",
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-realtime-2",
    blackstageRole: "voice_front_door",
    liveDefault: "disabled",
    browserMutationAllowed: false,
    browserReceivesProviderCredentials: false,
    highImpactApprovalRequired: true
  }
];

const workflowPolicy = {
  source: "WORKFLOW.md",
  version: "blackstage.workflow.v0",
  controlPlane: "symphony_style_internal_queue",
  codingWorker: "openai_codex",
  codexTransports: ["cli", "app_server"],
  agentWorker: "openai_agents_sdk_manager",
  voiceModel: "gpt-realtime-2",
  upstreamIntegrations,
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
  test.setTimeout(120_000);

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

  await page.goto("/", {
    waitUntil: "domcontentloaded"
  });

  const harnessStatus = page.getByTestId("harness-runner-status");

  await expect(harnessStatus).toContainText("0 open");
  await expect(harnessStatus).toContainText("WORKFLOW.md");
  await expect(harnessStatus).toContainText("Symphony queue");
  await expect(harnessStatus).toContainText("Codex CLI/App Server");
  await expect(harnessStatus).toContainText("Agents SDK manager");
  await expect(harnessStatus).toContainText("Memory approvals");
  await expect(harnessStatus).toContainText("5 source-pinned");
  await expect(harnessStatus).toContainText("2 open-source");
  await expect(harnessStatus).toContainText("gpt-realtime-2");
});
