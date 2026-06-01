import type {
  Artifact,
  IntentThread,
  StageEvent,
  StageObject
} from "@blackstage/stage-core";

export type GeneratedFrameKind =
  | "intent"
  | "labor"
  | "object"
  | "approval"
  | "artifact"
  | "speech";

export type GeneratedBlock =
  | {
      id: string;
      kind: "field";
      label: string;
      value: string;
      weight: "primary" | "support" | "quiet";
    }
  | {
      id: string;
      kind: "list";
      label: string;
      items: string[];
      weight: "primary" | "support" | "quiet";
    };

export type GeneratedPatch = {
  id: string;
  op: "add" | "replace" | "bind" | "action";
  label: string;
  source: StageEvent["type"];
};

export type GeneratedFrame = {
  id: string;
  kind: GeneratedFrameKind;
  label: string;
  source: StageEvent["type"];
  title: string;
  summary: string;
  signals: string[];
  blocks: GeneratedBlock[];
  patches: GeneratedPatch[];
  sequence: {
    index: number;
    label: string;
    progress: number;
  };
};

const renderableEventTypes: Array<StageEvent["type"]> = [
  "intent.submitted",
  "thread.created",
  "object.created",
  "object.updated",
  "agent.progress",
  "approval.requested",
  "approval.resolved",
  "artifact.created",
  "artifact.updated",
  "artifact.exported",
  "assistant.speech"
];

export function createGeneratedFrame(
  stageEvents: StageEvent[],
  thread: IntentThread
): GeneratedFrame {
  const renderableEvents = stageEvents.filter(isRenderableEvent);
  const latest =
    findPendingApprovalEvent(renderableEvents, thread) ?? renderableEvents.at(-1);
  const sequenceIndex = Math.max(renderableEvents.length, 1);

  if (!latest) {
    return withPatches(
      {
        id: `frame_${thread.id}_intent`,
        kind: "intent",
        label: "intent",
        source: "thread.created",
        title: thread.title,
        summary: thread.currentObjective,
        signals: ["listening", "parsing", "forming"],
        blocks: [
          createFieldBlock("intent", "intent", thread.originalIntent, "primary")
        ],
        sequence: createSequence(sequenceIndex, "thread.created")
      },
      "thread.created"
    );
  }

  return withPatches(
    eventToFrame(latest, thread, sequenceIndex),
    latest.type
  );
}

function eventToFrame(
  latest: StageEvent,
  thread: IntentThread,
  sequenceIndex: number
): Omit<GeneratedFrame, "patches"> {
  switch (latest.type) {
    case "intent.submitted":
      return {
        id: `frame_intent_${latest.payload.submittedAt}`,
        kind: "intent",
        label: latest.payload.inputMode,
        source: latest.type,
        title: latest.payload.rawText,
        summary: "The stage is listening and preparing a generated surface.",
        signals: ["voice intent", "semantic parse", "void field"],
        blocks: [
          createFieldBlock("input", "input", latest.payload.inputMode, "quiet")
        ],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    case "thread.created":
      return {
        id: `frame_thread_${latest.payload.id}`,
        kind: "intent",
        label: "thread",
        source: latest.type,
        title: formatFrameTitle(latest.payload.title, "artifact"),
        summary: latest.payload.currentObjective,
        signals: ["intent thread", latest.payload.status, "generated"],
        blocks: [
          createFieldBlock(
            "context",
            "context",
            latest.payload.contextSummary ?? latest.payload.originalIntent,
            "support"
          )
        ],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    case "object.created":
    case "object.updated":
      return objectToFrame(latest.payload, latest.type, sequenceIndex);
    case "agent.progress":
      return {
        id: `frame_labor_${latest.payload.id}`,
        kind: "labor",
        label: latest.payload.type.replace("_", " "),
        source: latest.type,
        title: latest.payload.summary,
        summary: latest.payload.details ?? "Visible agent work is streaming.",
        signals: [latest.payload.agentName, latest.payload.type, "auditable"],
        blocks: [
          createFieldBlock("operator", "operator", latest.payload.agentName, "quiet"),
          createFieldBlock(
            "state",
            "state",
            latest.payload.type.replace("_", " "),
            "support"
          )
        ],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    case "approval.requested":
      return {
        id: `frame_approval_${latest.payload.id}`,
        kind: "approval",
        label: "approval threshold",
        source: latest.type,
        title: latest.payload.title,
        summary: latest.payload.summary,
        signals: [
          latest.payload.riskLevel,
          latest.payload.actionType.replace("_", " "),
          "requires human"
        ],
        blocks: [
          createFieldBlock("scope", "scope", latest.payload.scope, "primary"),
          createFieldBlock(
            "consequence",
            "consequence",
            latest.payload.consequence,
            "support"
          )
        ],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    case "approval.resolved":
      return {
        id: `frame_approval_resolved_${latest.payload.approvalId}`,
        kind: "approval",
        label: "approval resolved",
        source: latest.type,
        title: latest.payload.status,
        summary: "The human decision has been recorded in the thread.",
        signals: ["decision", latest.payload.status, "trace updated"],
        blocks: [
          createFieldBlock("approval", "approval", latest.payload.approvalId, "quiet")
        ],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    case "artifact.created":
    case "artifact.updated":
      return artifactToFrame(latest.payload, latest.type, sequenceIndex);
    case "artifact.exported":
      return {
        id: `frame_export_${latest.payload.artifactId}`,
        kind: "artifact",
        label: "artifact export",
        source: latest.type,
        title: latest.payload.title,
        summary: `Exported as ${latest.payload.format}.`,
        signals: ["artifact", latest.payload.format, "local download"],
        blocks: [
          createFieldBlock("format", "format", latest.payload.format, "support")
        ],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    case "assistant.speech":
      return {
        id: `frame_speech_${latest.payload.speechId}`,
        kind: "speech",
        label: "stage voice",
        source: latest.type,
        title: latest.payload.text,
        summary: "The stage spoke a sparse status line.",
        signals: ["voice", "status", "thread"],
        blocks: [],
        sequence: createSequence(sequenceIndex, latest.type)
      };
    default:
      return {
        id: `frame_${thread.id}_fallback`,
        kind: "intent",
        label: "stream",
        source: "thread.created",
        title: thread.title,
        summary: thread.currentObjective,
        signals: ["generated surface", "thread", "active"],
        blocks: [],
        sequence: createSequence(sequenceIndex, "thread.created")
      };
  }
}

function objectToFrame(
  object: StageObject,
  source: "object.created" | "object.updated",
  sequenceIndex: number
): Omit<GeneratedFrame, "patches"> {
  return {
    id: `frame_object_${object.id}_${object.updatedAt}`,
    kind: "object",
    label: formatFrameLabel(object.type),
    source,
    title: formatFrameTitle(object.title, "object"),
    summary: object.summary ?? "A generated interface object is forming.",
    signals: extractSignals(object.payload, object.type),
    blocks: extractBlocks(object.payload),
    sequence: createSequence(sequenceIndex, source)
  };
}

function artifactToFrame(
  artifact: Artifact,
  source: "artifact.created" | "artifact.updated",
  sequenceIndex: number
): Omit<GeneratedFrame, "patches"> {
  return {
    id: `frame_artifact_${artifact.id}_${artifact.updatedAt}`,
    kind: "artifact",
    label: artifact.status === "approved" ? "approved artifact" : "draft artifact",
    source,
    title: formatFrameTitle(artifact.title, "artifact"),
    summary: extractArtifactSummary(artifact.content),
    signals: [artifact.type.replace("_", " "), artifact.status, "artifact"],
    blocks: extractBlocks(artifact.content),
    sequence: createSequence(sequenceIndex, source)
  };
}

function withPatches(
  frame: Omit<GeneratedFrame, "patches">,
  source: StageEvent["type"]
): GeneratedFrame {
  const patches: GeneratedPatch[] = [
    {
      id: `${frame.id}_root`,
      op: "replace",
      label: frame.label,
      source
    },
    {
      id: `${frame.id}_summary`,
      op: "bind",
      label: "summary",
      source
    },
    ...frame.blocks.map((block) => ({
      id: `${frame.id}_${block.id}`,
      op: "add" as const,
      label: block.label,
      source
    }))
  ];

  return {
    ...frame,
    patches
  };
}

function isRenderableEvent(event: StageEvent): boolean {
  return renderableEventTypes.includes(event.type);
}

function findPendingApprovalEvent(
  events: StageEvent[],
  thread: IntentThread
): StageEvent | undefined {
  const pendingApproval = thread.approvals.find(
    (approval) => approval.status === "pending"
  );

  if (!pendingApproval) {
    return undefined;
  }

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (
      event.type === "approval.requested" &&
      event.payload.id === pendingApproval.id
    ) {
      return event;
    }
  }

  return undefined;
}

function createSequence(index: number, source: StageEvent["type"]) {
  return {
    index,
    label: `patch ${String(index).padStart(2, "0")}`,
    progress: eventProgress(source)
  };
}

function eventProgress(source: StageEvent["type"]): number {
  switch (source) {
    case "intent.submitted":
      return 0.08;
    case "thread.created":
      return 0.16;
    case "object.created":
    case "object.updated":
      return 0.38;
    case "agent.progress":
      return 0.58;
    case "approval.requested":
      return 0.72;
    case "approval.resolved":
      return 0.82;
    case "artifact.created":
    case "artifact.updated":
      return 0.9;
    case "artifact.exported":
      return 1;
    case "assistant.speech":
      return 0.64;
    default:
      return 0.24;
  }
}

function extractSignals(payload: unknown, fallback: string): string[] {
  if (!isRecord(payload)) {
    return [fallback.replace("_", " "), "generated", "streaming"];
  }

  const candidates = [
    payload.component,
    payload.status,
    payload.modality,
    payload.documentTitle,
    payload.modelTitle,
    payload.simulationTitle,
    payload.center
  ].filter((value): value is string => typeof value === "string");

  for (const key of ["steps", "sections", "risks", "nodes", "scenarios", "notes"]) {
    const value = payload[key];

    if (Array.isArray(value)) {
      candidates.push(`${value.length} ${key}`);
    }
  }

  return candidates.length > 0
    ? candidates.slice(0, 4)
    : [fallback.replace("_", " "), "generated", "streaming"];
}

function extractBlocks(payload: unknown): GeneratedBlock[] {
  if (!isRecord(payload)) {
    return [];
  }

  const blocks: GeneratedBlock[] = [];
  const fieldKeys = [
    ["objective", "objective", "primary"],
    ["status", "status", "quiet"],
    ["artifactTitle", "artifact", "support"],
    ["documentTitle", "document", "support"],
    ["modelTitle", "model", "support"],
    ["simulationTitle", "simulation", "support"],
    ["center", "center", "support"],
    ["policy", "policy", "support"],
    ["guardrail", "guardrail", "primary"]
  ] as const;

  for (const [key, label, weight] of fieldKeys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      blocks.push(
        createFieldBlock(key, label, formatFrameTitle(value, "artifact"), weight)
      );
    }
  }

  for (const [key, label, weight] of [
    ["slices", "rendered slices", "primary"],
    ["files", "files", "support"],
    ["acceptanceCriteria", "acceptance", "primary"],
    ["acceptance", "acceptance", "primary"],
    ["observations", "observations", "support"],
    ["notes", "notes", "support"]
  ] as const) {
    const value = payload[key];

    if (Array.isArray(value)) {
      const items = value.filter((item): item is string => typeof item === "string");

      if (items.length > 0) {
        blocks.push(createListBlock(key, label, items, weight));
      }
    }
  }

  const sections = payload.sections;

  if (Array.isArray(sections)) {
    const items = sections
      .map((section) =>
        isRecord(section) &&
        typeof section.label === "string" &&
        typeof section.value === "string"
          ? `${section.label}: ${section.value}`
          : undefined
      )
      .filter((item): item is string => Boolean(item));

    if (items.length > 0) {
      blocks.push(createListBlock("sections", "sections", items, "support"));
    }
  }

  const scenarios = payload.scenarios;

  if (Array.isArray(scenarios)) {
    const items = scenarios
      .map((scenario) =>
        isRecord(scenario) &&
        typeof scenario.label === "string" &&
        typeof scenario.value === "string"
          ? `${scenario.label}: ${scenario.value}`
          : undefined
      )
      .filter((item): item is string => Boolean(item));

    if (items.length > 0) {
      blocks.push(createListBlock("model", "model", items, "support"));
    }
  }

  const nodes = payload.nodes;

  if (Array.isArray(nodes)) {
    const items = nodes
      .map((node) => {
        if (typeof node === "string") {
          return node;
        }

        return isRecord(node) && typeof node.label === "string"
          ? node.label
          : undefined;
      })
      .filter((item): item is string => Boolean(item));

    if (items.length > 0) {
      blocks.push(createListBlock("nodes", "nodes", items, "support"));
    }
  }

  return blocks;
}

function createFieldBlock(
  id: string,
  label: string,
  value: string,
  weight: GeneratedBlock["weight"]
): GeneratedBlock {
  return {
    id,
    kind: "field",
    label,
    value,
    weight
  };
}

function createListBlock(
  id: string,
  label: string,
  items: string[],
  weight: GeneratedBlock["weight"]
): GeneratedBlock {
  return {
    id,
    kind: "list",
    label,
    items,
    weight
  };
}

function extractArtifactSummary(content: unknown): string {
  if (!isRecord(content)) {
    return "Artifact content is ready for review.";
  }

  const value =
    content.recommendation ??
    content.objective ??
    content.insight ??
    content.summary ??
    "Artifact content is ready for review.";

  return typeof value === "string" ? value : "Artifact content is ready for review.";
}

function formatFrameTitle(title: string, kind: "artifact" | "object"): string {
  const normalized = title.replace(/\s+-\s+approved output$/i, "").trim();

  if (kind === "artifact" && title.includes(":")) {
    return normalized.split(":").slice(1).join(":").trim();
  }

  return normalized;
}

function formatFrameLabel(label: string): string {
  const normalized = label.replace(/_/g, " ");

  return normalized
    .replace(/\bcard\b/g, "")
    .replace(/\bportal\b/g, "surface")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
