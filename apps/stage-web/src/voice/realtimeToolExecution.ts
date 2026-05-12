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
  requestedAction?: string;
  reason?: string;
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
  const parsedArguments = parsePrepareExternalActionArguments(
    approval.toolCall.argumentsJson
  );
  const requestedAction = parsedArguments.action ?? "approval-gated Blackstage action";
  const reason =
    parsedArguments.reason ??
    "The live Realtime model requested a local action packet for human review.";
  const actionPacketId = `realtime_tool_${stableHash(`${approval.id}:${approval.toolCall.callId}`)}`;
  const functionOutput: StageWebRealtimeToolExecutionOutput = {
    status: "completed",
    action: "prepare_external_action",
    actionPacketId,
    approvalId: approval.id,
    callId: approval.toolCall.callId,
    toolName: approval.toolCall.toolName,
    requestedAction,
    reason,
    externalSideEffects: false,
    result: `Prepared a local Blackstage action packet for human review: ${requestedAction}. No external system was contacted.`
  };
  const taskObject: StageObject = {
    id: `${actionPacketId}_task`,
    threadId: approval.threadId,
    type: "codex_task_card",
    title: `Realtime tool result: ${approval.toolCall.toolName}`,
    summary: `Prepared for review: ${requestedAction}`,
    payload: {
      provider: approval.toolCall.provider,
      callId: approval.toolCall.callId,
      toolName: approval.toolCall.toolName,
      requestedAction,
      reason,
      status: "completed",
      functionOutput,
      policy: "Stage approval resolved before local tool execution.",
      externalSideEffects: false,
      parsedArgumentsStored: true,
      rawArgumentsStored: false,
      steps: [
        "Approval resolved",
        `Requested action captured: ${requestedAction}`,
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
      requestedAction,
      reason,
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
          details: `The approved function call prepared "${requestedAction}" as a local action packet and function output; no external system was contacted.`,
          evidence: [
            {
              id: `${actionPacketId}_call`,
              label: approval.toolCall.toolName,
              sourceType: "agent_log",
              excerpt: `call_id: ${approval.toolCall.callId}; action: ${requestedAction}`
            }
          ],
          timestamp: executedAt
        }
      }
    ]
  };
}

function parsePrepareExternalActionArguments(argumentsJson?: string): {
  action?: string;
  reason?: string;
} {
  if (!argumentsJson?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(argumentsJson) as unknown;

    if (!isRecord(parsed)) {
      return {};
    }

    return {
      action: compactArgumentText(parsed.action, 180),
      reason: compactArgumentText(parsed.reason, 260)
    };
  } catch {
    return {};
  }
}

function compactArgumentText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const compacted = value.replace(/\s+/g, " ").trim();

  return compacted ? compacted.slice(0, maxLength) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
