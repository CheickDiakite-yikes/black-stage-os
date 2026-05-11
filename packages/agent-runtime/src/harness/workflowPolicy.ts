export const BLACKSTAGE_WORKFLOW_POLICY_SOURCE = "WORKFLOW.md";
export const BLACKSTAGE_WORKFLOW_POLICY_VERSION = "blackstage.workflow.v0";

export type HarnessWorkflowPolicy = {
  source: typeof BLACKSTAGE_WORKFLOW_POLICY_SOURCE;
  version: typeof BLACKSTAGE_WORKFLOW_POLICY_VERSION;
  controlPlane: "symphony_style_internal_queue";
  codingWorker: "openai_codex";
  codexTransports: readonly ["cli", "app_server"];
  agentWorker: "openai_agents_sdk_manager";
  voiceModel: "gpt-realtime-2";
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
