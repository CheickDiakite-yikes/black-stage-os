import type {
  ApprovalRequest,
  Artifact,
  IntentThread,
  StageEvent,
  StageObject
} from "@blackstage/stage-core";

type StageGeneratedStreamProps = {
  onApprove: (approvalId: string) => void;
  onAskWhy: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  stageEvents: StageEvent[];
  thread: IntentThread;
};

type GeneratedFrame = {
  id: string;
  kind: "intent" | "labor" | "object" | "approval" | "artifact" | "speech";
  label: string;
  source: StageEvent["type"];
  title: string;
  summary: string;
  signals: string[];
  details: GeneratedDetail[];
};

type GeneratedDetail =
  | {
      kind: "field";
      label: string;
      value: string;
    }
  | {
      kind: "list";
      label: string;
      items: string[];
    };

export function StageGeneratedStream({
  onApprove,
  onAskWhy,
  onReject,
  stageEvents,
  thread
}: StageGeneratedStreamProps) {
  if (!thread.originalIntent) {
    return null;
  }

  const frame = createGeneratedFrame(stageEvents, thread);
  const pendingApproval = thread.approvals.find(
    (approval) => approval.status === "pending"
  );

  return (
    <section
      className={`stage-generated-stream stage-generated-stream-${frame.kind}`}
      aria-label="Streaming generated interface"
      data-frame-kind={frame.kind}
      data-frame-source={frame.source}
      data-testid="stage-generated-stream"
    >
      <div className="generated-stream-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="generated-stream-meta">
        <span>{frame.label}</span>
        <strong>{frame.source}</strong>
      </div>
      <div className="generated-stream-surface" key={frame.id}>
        <h2>{frame.title}</h2>
        <p>{frame.summary}</p>
        {frame.details.length > 0 ? (
          <div className="generated-stream-body" aria-label="Generated UI body">
            {frame.details.slice(0, 4).map((detail) => (
              <GeneratedDetailBlock detail={detail} key={detail.label} />
            ))}
          </div>
        ) : null}
        {frame.details.length === 0 && frame.signals.length > 0 ? (
          <div className="generated-stream-signals" aria-label="Generated UI signals">
            {frame.signals.slice(0, 3).map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        ) : null}
        {pendingApproval ? (
          <GeneratedApprovalActions
            approval={pendingApproval}
            onApprove={onApprove}
            onAskWhy={onAskWhy}
            onReject={onReject}
          />
        ) : null}
      </div>
    </section>
  );
}

function GeneratedApprovalActions({
  approval,
  onApprove,
  onAskWhy,
  onReject
}: {
  approval: ApprovalRequest;
  onApprove: (approvalId: string) => void;
  onAskWhy: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}) {
  return (
    <div className="generated-stream-actions" aria-label="Approval actions">
      <span>{approval.riskLevel} approval</span>
      <button onClick={() => onReject(approval.id)} type="button">
        Reject
      </button>
      <button onClick={() => onAskWhy(approval.id)} type="button">
        Why
      </button>
      <button onClick={() => onApprove(approval.id)} type="button">
        Approve
      </button>
    </div>
  );
}

function GeneratedDetailBlock({ detail }: { detail: GeneratedDetail }) {
  if (detail.kind === "list") {
    return (
      <div className="generated-stream-detail generated-stream-detail-list">
        <span>{detail.label}</span>
        <ul>
          {detail.items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="generated-stream-detail">
      <span>{detail.label}</span>
      <strong>{detail.value}</strong>
    </div>
  );
}

function createGeneratedFrame(
  stageEvents: StageEvent[],
  thread: IntentThread
): GeneratedFrame {
  const latest = findLatestRenderableEvent(stageEvents);

  if (!latest) {
    return {
      id: `frame_${thread.id}_intent`,
      kind: "intent",
      label: "intent",
      source: "thread.created",
      title: thread.title,
      summary: thread.currentObjective,
      signals: ["listening", "parsing", "forming"],
      details: [
        {
          kind: "field",
          label: "intent",
          value: thread.originalIntent
        }
      ]
    };
  }

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
        details: [
          {
            kind: "field",
            label: "input",
            value: latest.payload.inputMode
          }
        ]
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
        details: [
          {
            kind: "field",
            label: "context",
            value: latest.payload.contextSummary ?? latest.payload.originalIntent
          }
        ]
      };
    case "object.created":
    case "object.updated":
      return objectToFrame(latest.payload, latest.type);
    case "agent.progress":
      return {
        id: `frame_labor_${latest.payload.id}`,
        kind: "labor",
        label: latest.payload.type.replace("_", " "),
        source: latest.type,
        title: latest.payload.summary,
        summary: latest.payload.details ?? "Visible agent work is streaming.",
        signals: [latest.payload.agentName, latest.payload.type, "auditable"],
        details: [
          {
            kind: "field",
            label: "operator",
            value: latest.payload.agentName
          },
          {
            kind: "field",
            label: "state",
            value: latest.payload.type.replace("_", " ")
          }
        ]
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
        details: [
          {
            kind: "field",
            label: "scope",
            value: latest.payload.scope
          },
          {
            kind: "field",
            label: "consequence",
            value: latest.payload.consequence
          }
        ]
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
        details: [
          {
            kind: "field",
            label: "approval",
            value: latest.payload.approvalId
          }
        ]
      };
    case "artifact.created":
    case "artifact.updated":
      return artifactToFrame(latest.payload, latest.type);
    case "artifact.exported":
      return {
        id: `frame_export_${latest.payload.artifactId}`,
        kind: "artifact",
        label: "artifact export",
        source: latest.type,
        title: latest.payload.title,
        summary: `Exported as ${latest.payload.format}.`,
        signals: ["artifact", latest.payload.format, "local download"],
        details: [
          {
            kind: "field",
            label: "format",
            value: latest.payload.format
          }
        ]
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
        details: []
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
        details: []
      };
  }
}

function findLatestRenderableEvent(stageEvents: StageEvent[]): StageEvent | undefined {
  return [...stageEvents]
    .reverse()
    .find((event) =>
      [
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
      ].includes(event.type)
    );
}

function objectToFrame(
  object: StageObject,
  source: "object.created" | "object.updated"
): GeneratedFrame {
  return {
    id: `frame_object_${object.id}_${object.updatedAt}`,
    kind: "object",
    label: formatFrameLabel(object.type),
    source,
    title: formatFrameTitle(object.title, "object"),
    summary: object.summary ?? "A generated interface object is forming.",
    signals: extractSignals(object.payload, object.type),
    details: extractDetails(object.payload)
  };
}

function artifactToFrame(
  artifact: Artifact,
  source: "artifact.created" | "artifact.updated"
): GeneratedFrame {
  return {
    id: `frame_artifact_${artifact.id}_${artifact.updatedAt}`,
    kind: "artifact",
    label: artifact.status === "approved" ? "approved artifact" : "draft artifact",
    source,
    title: formatFrameTitle(artifact.title, "artifact"),
    summary: extractArtifactSummary(artifact.content),
    signals: [artifact.type.replace("_", " "), artifact.status, "artifact"],
    details: extractDetails(artifact.content)
  };
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

function extractDetails(payload: unknown): GeneratedDetail[] {
  if (!isRecord(payload)) {
    return [];
  }

  const details: GeneratedDetail[] = [];
  const fieldKeys = [
    ["objective", "objective"],
    ["status", "status"],
    ["artifactTitle", "artifact"],
    ["documentTitle", "document"],
    ["modelTitle", "model"],
    ["simulationTitle", "simulation"],
    ["center", "center"],
    ["policy", "policy"],
    ["guardrail", "guardrail"]
  ] as const;

  for (const [key, label] of fieldKeys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      details.push({
        kind: "field",
        label,
        value: formatFrameTitle(value, "artifact")
      });
    }
  }

  for (const [key, label] of [
    ["slices", "rendered slices"],
    ["files", "files"],
    ["acceptanceCriteria", "acceptance"],
    ["acceptance", "acceptance"],
    ["observations", "observations"],
    ["notes", "notes"]
  ] as const) {
    const value = payload[key];

    if (Array.isArray(value)) {
      const items = value.filter((item): item is string => typeof item === "string");

      if (items.length > 0) {
        details.push({
          kind: "list",
          label,
          items
        });
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
      details.push({
        kind: "list",
        label: "sections",
        items
      });
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
      details.push({
        kind: "list",
        label: "model",
        items
      });
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
      details.push({
        kind: "list",
        label: "nodes",
        items
      });
    }
  }

  return details;
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
