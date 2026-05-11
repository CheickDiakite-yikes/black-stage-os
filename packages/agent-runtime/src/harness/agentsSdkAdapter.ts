import type {
  HarnessAdapter,
  HarnessRunResult,
  HarnessTask,
  HarnessTaskKind
} from "./harnessTypes";

export type AgentsSdkSpecialistKind =
  | "research"
  | "artifact"
  | "memory"
  | "planning"
  | "approval";

export type AgentsSdkToolPlan = {
  name: string;
  specialistKind: AgentsSdkSpecialistKind;
  description: string;
  requiresStageApproval: boolean;
};

export type AgentsSdkMemoryAccessPolicy = {
  inspection: "stage_approval_required";
  retrieval: "redacted_summaries_only";
  writes: "stage_approval_required";
  deletes: "stage_approval_required";
  rawMemoryAccess: "forbidden";
  providerPersistence: "forbidden";
};

export type AgentsSdkRunPlan = {
  provider: "openai_agents_sdk";
  executionMode: "dry_run";
  orchestration: "manager_agent_with_tools";
  taskId: string;
  threadId: string;
  title: string;
  objective: string;
  managerInstructions: string;
  tools: AgentsSdkToolPlan[];
  memoryAccessPolicy: AgentsSdkMemoryAccessPolicy;
  handoffsAllowed: false;
  tracing: {
    enabled: true;
    redaction: "stage_event_summaries_only";
  };
  humanReviewRequired: true;
};

export type AgentsSdkAdapterOptions = {
  tools?: AgentsSdkToolPlan[];
  memoryAccessPolicy?: AgentsSdkMemoryAccessPolicy;
};

const agentsSdkTaskKinds: HarnessTaskKind[] = ["agent", "research", "artifact"];

const defaultAgentsSdkTools: AgentsSdkToolPlan[] = [
  {
    name: "research_synthesizer",
    specialistKind: "research",
    description: "Synthesize bounded research notes into stage artifacts.",
    requiresStageApproval: false
  },
  {
    name: "artifact_writer",
    specialistKind: "artifact",
    description: "Draft editable artifacts from approved thread context.",
    requiresStageApproval: false
  },
  {
    name: "memory_inspector",
    specialistKind: "memory",
    description: "Inspect approved local memory summaries without writing memory.",
    requiresStageApproval: true
  }
];

export const defaultAgentsSdkMemoryAccessPolicy: AgentsSdkMemoryAccessPolicy = {
  inspection: "stage_approval_required",
  retrieval: "redacted_summaries_only",
  writes: "stage_approval_required",
  deletes: "stage_approval_required",
  rawMemoryAccess: "forbidden",
  providerPersistence: "forbidden"
};

export function createAgentsSdkRunPlan(
  task: HarnessTask,
  options: AgentsSdkAdapterOptions = {}
): AgentsSdkRunPlan {
  if (!agentsSdkTaskKinds.includes(task.kind)) {
    throw new Error(`Agents SDK adapter cannot run ${task.kind} tasks.`);
  }

  if (task.approvalRequired) {
    throw new Error("Agents SDK run plan requires approval before preparation.");
  }

  const tools = options.tools ?? defaultAgentsSdkTools;
  const memoryAccessPolicy =
    options.memoryAccessPolicy ?? defaultAgentsSdkMemoryAccessPolicy;

  return {
    provider: "openai_agents_sdk",
    executionMode: "dry_run",
    orchestration: "manager_agent_with_tools",
    taskId: task.id,
    threadId: task.threadId,
    title: task.title,
    objective: task.objective,
    managerInstructions: createManagerInstructions(task, tools),
    tools,
    memoryAccessPolicy,
    handoffsAllowed: false,
    tracing: {
      enabled: true,
      redaction: "stage_event_summaries_only"
    },
    humanReviewRequired: true
  };
}

export function createDryRunAgentsSdkAdapter(
  options: AgentsSdkAdapterOptions = {}
): HarnessAdapter {
  return {
    id: "agents_sdk_adapter_dry_run",
    label: "Agents SDK adapter",
    mode: "agents_sdk",
    accepts: agentsSdkTaskKinds,
    canRun: (task) => agentsSdkTaskKinds.includes(task.kind) && !task.approvalRequired,
    run: (task) => createDryRunAgentsSdkResult(createAgentsSdkRunPlan(task, options))
  };
}

function createDryRunAgentsSdkResult(plan: AgentsSdkRunPlan): HarnessRunResult {
  return {
    status: "completed",
    summary: `Prepared dry-run Agents SDK manager plan for ${plan.title}.`,
    events: [
      {
        type: "task.progress",
        summary: "Prepared manager-agent plan with specialists exposed as tools.",
        payload: {
          provider: plan.provider,
          orchestration: plan.orchestration,
          execution_mode: plan.executionMode,
          handoffs_allowed: plan.handoffsAllowed
        }
      },
      {
        type: "task.progress",
        summary: "Attached trace redaction and approval-aware tool policy.",
        payload: {
          tracing_enabled: plan.tracing.enabled,
          trace_redaction: plan.tracing.redaction,
          approval_tools: plan.tools
            .filter((tool) => tool.requiresStageApproval)
            .map((tool) => tool.name),
          memory_policy: plan.memoryAccessPolicy,
          human_review_required: plan.humanReviewRequired
        }
      }
    ]
  };
}

function createManagerInstructions(
  task: HarnessTask,
  tools: AgentsSdkToolPlan[]
): string {
  return [
    `Task: ${task.title}`,
    "",
    "Objective:",
    task.objective,
    "",
    "Blackstage manager rules:",
    "- Keep the Stage Shell as the visible source of truth.",
    "- Treat specialists as tools unless a human explicitly approves a handoff.",
    "- Emit progress as harness events suitable for replay.",
    "- Use only redacted memory summaries unless Stage approval grants a narrow memory action.",
    "- Request Stage approval before memory inspection, writes, deletes, external actions, or publication.",
    "- Do not persist Blackstage memory through provider-side agent state.",
    "- Return artifact drafts with provenance and human-review status.",
    "",
    "Available specialist tools:",
    ...tools.map(
      (tool) =>
        `- ${tool.name}: ${tool.description}${
          tool.requiresStageApproval ? " Requires Stage approval." : ""
        }`
    )
  ].join("\n");
}
