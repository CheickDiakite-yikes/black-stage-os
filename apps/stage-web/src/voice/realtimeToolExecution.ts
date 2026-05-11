import type {
  ApprovalRequest,
  Artifact,
  StageEvent,
  StageObject
} from "@blackstage/stage-core";

export type StageWebRealtimeToolExecutionOutput = {
  status: "completed";
  action: "prepare_external_action";
  actionPacketId: string;
  approvalId: string;
  callId: string;
  toolName: string;
  externalSideEffects: false;
  result: string;
};

export type StageWebRealtimeToolExecution = {
  functionOutput: StageWebRealtimeToolExecutionOutput;
  stageEvents: StageEvent[];
};

type ExecutableStageWebRealtimeToolApproval = ApprovalRequest & {
  toolCall: NonNullable<ApprovalRequest["toolCall"]> & {
    provider: "openai_realtime";
  };
};

export function canExecuteStageWebRealtimeTool(
  approval?: ApprovalRequest
): approval is ExecutableStageWebRealtimeToolApproval {
  const toolName = approval?.toolCall?.toolName;

  return Boolean(
    approval?.actionType === "tool_call" &&
    approval.toolCall?.provider === "openai_realtime" &&
    toolName &&
    normalizeRealtimeToolName(toolName) === "blackstage_prepare_external_action"
  );
}

export function createStageWebRealtimeToolExecution(
  approval: ApprovalRequest,
  options: {
    executedAt?: string;
    zIndex?: number;
  } = {}
): StageWebRealtimeToolExecution | undefined {
  if (!canExecuteStageWebRealtimeTool(approval)) {
    return undefined;
  }

  const executedAt = options.executedAt ?? new Date().toISOString();
  const actionPacketId = `realtime_tool_${stableHash(`${approval.id}:${approval.toolCall.callId}`)}`;
  const functionOutput: StageWebRealtimeToolExecutionOutput = {
    status: "completed",
    action: "prepare_external_action",
    actionPacketId,
    approvalId: approval.id,
    callId: approval.toolCall.callId,
    toolName: approval.toolCall.toolName,
    externalSideEffects: false,
    result:
      "Prepared a local Blackstage action packet for human review. No external system was contacted."
  };
  const taskObject: StageObject = {
    id: `${actionPacketId}_task`,
    threadId: approval.threadId,
    type: "codex_task_card",
    title: `Realtime tool result: ${approval.toolCall.toolName}`,
    summary:
      "Approved Realtime function call executed as a local, render-only Blackstage tool.",
    payload: {
      provider: approval.toolCall.provider,
      callId: approval.toolCall.callId,
      toolName: approval.toolCall.toolName,
      status: "completed",
      functionOutput,
      policy: "Stage approval resolved before local tool execution.",
      externalSideEffects: false,
      steps: [
        "Approval resolved",
        "Local function adapter executed",
        "Function output prepared for the Realtime model"
      ]
    },
    position: {
      x: 58,
      y: 58,
      z: options.zIndex ?? 40
    },
    state: "focused",
    pinned: true,
    createdAt: executedAt,
    updatedAt: executedAt
  };
  const resultArtifact: Artifact = {
    id: `${actionPacketId}_artifact`,
    threadId: approval.threadId,
    type: "brief",
    title: `Realtime Tool Result: ${approval.toolCall.toolName}`,
    status: "review",
    content: {
      approvalId: approval.id,
      callId: approval.toolCall.callId,
      toolName: approval.toolCall.toolName,
      output: functionOutput,
      rawArgumentsStored: false
    },
    provenance: [
      {
        id: `${actionPacketId}_approval`,
        label: "Approved Realtime tool call",
        sourceType: "agent_log",
        excerpt: approval.title
      }
    ],
    createdAt: executedAt,
    updatedAt: executedAt
  };

  return {
    functionOutput,
    stageEvents: [
      {
        type: "object.created",
        payload: taskObject
      },
      {
        type: "artifact.created",
        payload: resultArtifact
      },
      {
        type: "agent.progress",
        payload: {
          id: `${actionPacketId}_completed`,
          threadId: approval.threadId,
          taskId: actionPacketId,
          agentName: "Realtime tool runner",
          type: "completed",
          summary: "Realtime tool executed locally.",
          details:
            "The approved function call produced a local action packet and function output; no external system was contacted.",
          evidence: [
            {
              id: `${actionPacketId}_call`,
              label: approval.toolCall.toolName,
              sourceType: "agent_log",
              excerpt: `call_id: ${approval.toolCall.callId}`
            }
          ],
          timestamp: executedAt
        }
      }
    ]
  };
}

function normalizeRealtimeToolName(toolName: string): string {
  return toolName.trim().replace(/[.-]/g, "_");
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
