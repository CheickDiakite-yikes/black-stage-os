export const BLACKSTAGE_WORKFLOW_POLICY_SOURCE = "WORKFLOW.md";
export const BLACKSTAGE_WORKFLOW_POLICY_VERSION = "blackstage.workflow.v0";

export type HarnessUpstreamIntegrationId =
  | "openai_codex_cli"
  | "openai_codex_app_server"
  | "openai_agents_sdk"
  | "openai_symphony"
  | "openai_realtime_voice";

export type HarnessUpstreamIntegration = {
  id: HarnessUpstreamIntegrationId;
  sourceKind:
    | "official_docs"
    | "official_open_source_reference"
    | "official_model_docs";
  sourceUrl: string;
  openSourceUrl?: string;
  blackstageRole:
    | "coding_worker_cli"
    | "coding_worker_app_server"
    | "agent_manager_runtime"
    | "orchestration_control_plane_pattern"
    | "voice_front_door";
  liveDefault: "disabled" | "dry_run";
  browserMutationAllowed: false;
  browserReceivesProviderCredentials: false;
  highImpactApprovalRequired: true;
};

export const BLACKSTAGE_UPSTREAM_INTEGRATIONS = [
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
] as const satisfies readonly HarnessUpstreamIntegration[];

export type HarnessWorkflowPolicy = {
  source: typeof BLACKSTAGE_WORKFLOW_POLICY_SOURCE;
  version: typeof BLACKSTAGE_WORKFLOW_POLICY_VERSION;
  controlPlane: "symphony_style_internal_queue";
  codingWorker: "openai_codex";
  codexTransports: readonly ["cli", "app_server"];
  agentWorker: "openai_agents_sdk_manager";
  voiceModel: "gpt-realtime-2";
  upstreamIntegrations: readonly HarnessUpstreamIntegration[];
  agentMemoryAccessDefault: "stage_approval_required";
  workspaceRoot: ".blackstage/workspaces";
  browserMutationAllowed: false;
  browserReceivesProviderCredentials: false;
  liveExecutionDefault: "disabled";
  humanApprovalRequiredForHighImpactActions: true;
  humanReviewRequired: true;
  proofPacketRequired: true;
};

export function createBlackstageWorkflowPolicy(): HarnessWorkflowPolicy {
  return {
    source: BLACKSTAGE_WORKFLOW_POLICY_SOURCE,
    version: BLACKSTAGE_WORKFLOW_POLICY_VERSION,
    controlPlane: "symphony_style_internal_queue",
    codingWorker: "openai_codex",
    codexTransports: ["cli", "app_server"],
    agentWorker: "openai_agents_sdk_manager",
    voiceModel: "gpt-realtime-2",
    upstreamIntegrations: BLACKSTAGE_UPSTREAM_INTEGRATIONS,
    agentMemoryAccessDefault: "stage_approval_required",
    workspaceRoot: ".blackstage/workspaces",
    browserMutationAllowed: false,
    browserReceivesProviderCredentials: false,
    liveExecutionDefault: "disabled",
    humanApprovalRequiredForHighImpactActions: true,
    humanReviewRequired: true,
    proofPacketRequired: true
  };
}

export function isHarnessWorkflowPolicy(
  value: unknown
): value is HarnessWorkflowPolicy {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HarnessWorkflowPolicy>;

  return (
    candidate.source === BLACKSTAGE_WORKFLOW_POLICY_SOURCE &&
    candidate.version === BLACKSTAGE_WORKFLOW_POLICY_VERSION &&
    candidate.controlPlane === "symphony_style_internal_queue" &&
    candidate.codingWorker === "openai_codex" &&
    Array.isArray(candidate.codexTransports) &&
    candidate.codexTransports.length === 2 &&
    candidate.codexTransports[0] === "cli" &&
    candidate.codexTransports[1] === "app_server" &&
    candidate.agentWorker === "openai_agents_sdk_manager" &&
    candidate.voiceModel === "gpt-realtime-2" &&
    hasExpectedUpstreamIntegrations(candidate.upstreamIntegrations) &&
    candidate.agentMemoryAccessDefault === "stage_approval_required" &&
    candidate.workspaceRoot === ".blackstage/workspaces" &&
    candidate.browserMutationAllowed === false &&
    candidate.browserReceivesProviderCredentials === false &&
    candidate.liveExecutionDefault === "disabled" &&
    candidate.humanApprovalRequiredForHighImpactActions === true &&
    candidate.humanReviewRequired === true &&
    candidate.proofPacketRequired === true
  );
}

function hasExpectedUpstreamIntegrations(value: unknown): boolean {
  if (
    !Array.isArray(value) ||
    value.length !== BLACKSTAGE_UPSTREAM_INTEGRATIONS.length
  ) {
    return false;
  }

  return BLACKSTAGE_UPSTREAM_INTEGRATIONS.every((expected, index) => {
    const candidate = value[index] as Partial<HarnessUpstreamIntegration> | undefined;

    return (
      candidate?.id === expected.id &&
      candidate.sourceKind === expected.sourceKind &&
      candidate.sourceUrl === expected.sourceUrl &&
      candidate.openSourceUrl === getExpectedOpenSourceUrl(expected) &&
      candidate.blackstageRole === expected.blackstageRole &&
      candidate.liveDefault === expected.liveDefault &&
      candidate.browserMutationAllowed === false &&
      candidate.browserReceivesProviderCredentials === false &&
      candidate.highImpactApprovalRequired === true
    );
  });
}

function getExpectedOpenSourceUrl(
  integration: (typeof BLACKSTAGE_UPSTREAM_INTEGRATIONS)[number]
): string | undefined {
  return "openSourceUrl" in integration ? integration.openSourceUrl : undefined;
}
