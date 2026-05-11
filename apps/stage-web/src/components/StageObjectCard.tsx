import type { StageObject } from "@blackstage/stage-core";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

type StageObjectCardProps = {
  object: StageObject;
  onCollapseToggle: (objectId: string) => void;
  onFocus: (objectId: string) => void;
  onMove: (
    objectId: string,
    position: {
      x: number;
      y: number;
      z?: number;
    }
  ) => void;
  onPinToggle: (objectId: string) => void;
};

const objectLabels: Record<StageObject["type"], string> = {
  agent_feed: "Agent feed",
  approval_card: "Approval",
  artifact_card: "Artifact",
  browser_portal: "Portal",
  chart: "Chart",
  code_diff: "Code",
  codex_task_card: "Codex task",
  document_portal: "Document",
  intent_card: "Intent",
  map_portal: "Map",
  memory_card: "Memory",
  model_card: "Model",
  plan_card: "Plan",
  research_note: "Research",
  risk_matrix: "Risk",
  simulation_card: "Simulation",
  table: "Table",
  timeline: "Timeline"
};

export function StageObjectCard({
  object,
  onCollapseToggle,
  onFocus,
  onMove,
  onPinToggle
}: StageObjectCardProps) {
  const dragStartRef = useRef<
    | {
        pointerX: number;
        pointerY: number;
        objectX: number;
        objectY: number;
      }
    | undefined
  >(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const objectStyle = {
    "--object-shift-x": `${object.position?.x ?? 0}px`,
    "--object-shift-y": `${object.position?.y ?? 0}px`
  } as CSSProperties;

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      objectX: object.position?.x ?? 0,
      objectY: object.position?.y ?? 0
    };
    setIsDragging(true);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragStartRef.current || !isDragging) {
      return;
    }

    const nextX =
      dragStartRef.current.objectX + event.clientX - dragStartRef.current.pointerX;
    const nextY =
      dragStartRef.current.objectY + event.clientY - dragStartRef.current.pointerY;

    onMove(object.id, {
      x: Math.round(nextX),
      y: Math.round(nextY),
      z: object.position?.z
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    dragStartRef.current = undefined;
  }

  function nudgeObject() {
    onMove(object.id, {
      x: (object.position?.x ?? 0) + 28,
      y: object.position?.y ?? 0,
      z: object.position?.z
    });
  }

  return (
    <article
      className={`stage-object stage-object-${object.type} stage-object-${object.state} ${
        object.pinned ? "stage-object-pinned" : ""
      } ${isDragging ? "stage-object-dragging" : ""}`}
      data-testid={`stage-object-${object.type}`}
      style={objectStyle}
    >
      <div className="object-chrome">
        <span>{objectLabels[object.type]}</span>
        <span>{object.pinned ? `pinned · ${object.state}` : object.state}</span>
      </div>
      <div className="object-actions" aria-label={`Object actions for ${object.title}`}>
        <button
          type="button"
          aria-label={`Focus ${object.title}`}
          onClick={() => onFocus(object.id)}
        >
          Focus
        </button>
        <button
          type="button"
          aria-label={`Pin ${object.title}`}
          onClick={() => onPinToggle(object.id)}
        >
          {object.pinned ? "Unpin" : "Pin"}
        </button>
        <button
          type="button"
          aria-label={`${object.state === "collapsed" ? "Expand" : "Collapse"} ${object.title}`}
          onClick={() => onCollapseToggle(object.id)}
        >
          {object.state === "collapsed" ? "Expand" : "Collapse"}
        </button>
        <button
          className="object-drag-handle"
          type="button"
          aria-label={`Move ${object.title}`}
          onClick={nudgeObject}
        >
          Move
        </button>
        <button
          className="object-drag-handle"
          type="button"
          aria-label={`Drag ${object.title}`}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          Drag
        </button>
      </div>
      <h2>{object.title}</h2>
      {object.state === "collapsed" ? null : (
        <>
          {object.summary ? <p>{object.summary}</p> : null}
          <ObjectSurface object={object} />
          <ObjectAnnotations object={object} />
        </>
      )}
    </article>
  );
}

function ObjectSurface({ object }: { object: StageObject }) {
  switch (object.type) {
    case "document_portal":
      return <DocumentPortalSurface payload={object.payload} />;
    case "browser_portal":
      return <BrowserPortalSurface payload={object.payload} />;
    case "map_portal":
      return <MapPortalSurface payload={object.payload} />;
    case "memory_card":
      return <MemorySurface payload={object.payload} />;
    case "model_card":
      return <ModelSurface payload={object.payload} />;
    case "simulation_card":
      return <SimulationSurface payload={object.payload} />;
    default:
      return <PayloadPreview payload={object.payload} />;
  }
}

function DocumentPortalSurface({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return <PayloadPreview payload={payload} />;
  }

  const sections = Array.isArray(payload.sections)
    ? payload.sections.filter(isRecord)
    : [];
  const isImageContext =
    payload.modality === "image" && typeof payload.previewUrl === "string";

  return (
    <div
      className="portal-surface document-portal-surface"
      data-testid="document-portal-surface"
    >
      <div className="portal-strip">
        <span>document</span>
        <span>{formatPayloadValue(payload.status ?? "open")}</span>
      </div>
      <h3>{formatPayloadValue(payload.documentTitle ?? "Stage document")}</h3>
      {isImageContext ? (
        <figure className="image-context-preview">
          <img
            alt=""
            data-testid="image-context-preview"
            src={formatPayloadValue(payload.previewUrl)}
          />
          <figcaption>Session-only local preview</figcaption>
        </figure>
      ) : null}
      <dl>
        {sections.slice(0, 5).map((section, index) => (
          <div key={`${index}_${formatPayloadValue(section.label ?? "section")}`}>
            <dt>{formatPayloadValue(section.label ?? "Section")}</dt>
            <dd>
              {formatPayloadValue(
                section.value ?? section.summary ?? "Ready for inspection"
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BrowserPortalSurface({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return <PayloadPreview payload={payload} />;
  }

  const observations = Array.isArray(payload.observations) ? payload.observations : [];

  return (
    <div
      className="portal-surface browser-portal-surface"
      data-testid="browser-portal-surface"
    >
      <div className="browser-bar" aria-label="Simulated browser portal">
        <span className="browser-dot" />
        <code>{formatPayloadValue(payload.url ?? "blackstage://stage")}</code>
        <span>{formatPayloadValue(payload.status ?? "ready")}</span>
      </div>
      {observations.length > 0 ? (
        <ul>
          {observations.slice(0, 4).map((observation, index) => (
            <li key={`${index}_${formatPayloadValue(observation)}`}>
              {formatPayloadValue(observation)}
            </li>
          ))}
        </ul>
      ) : null}
      {payload.guardrail ? <p>{formatPayloadValue(payload.guardrail)}</p> : null}
    </div>
  );
}

function ModelSurface({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return <PayloadPreview payload={payload} />;
  }

  const scenarios = Array.isArray(payload.scenarios)
    ? payload.scenarios.filter(isRecord)
    : [];

  return (
    <div className="cognitive-surface model-surface" data-testid="model-surface">
      <div className="portal-strip">
        <span>model</span>
        <span>{formatPayloadValue(payload.status ?? "ready")}</span>
      </div>
      <h3>{formatPayloadValue(payload.modelTitle ?? "Working model")}</h3>
      <div className="model-grid">
        {scenarios.slice(0, 4).map((scenario, index) => (
          <div key={`${index}_${formatPayloadValue(scenario.label ?? "scenario")}`}>
            <span>{formatPayloadValue(scenario.label ?? "Scenario")}</span>
            <strong>
              {formatPayloadValue(scenario.value ?? scenario.output ?? "Pending")}
            </strong>
            {scenario.confidence ? (
              <em>{formatPayloadValue(scenario.confidence)} confidence</em>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function MapPortalSurface({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return <PayloadPreview payload={payload} />;
  }

  const nodes = Array.isArray(payload.nodes) ? payload.nodes.filter(isRecord) : [];

  return (
    <div className="cognitive-surface map-surface" data-testid="map-surface">
      <div className="portal-strip">
        <span>map</span>
        <span>{formatPayloadValue(payload.status ?? "simulated")}</span>
      </div>
      <div className="map-field" aria-label="Simulated object map">
        <span className="map-center">
          {formatPayloadValue(payload.center ?? "Intent")}
        </span>
        {nodes.slice(0, 5).map((node, index) => {
          const angle = typeof node.angle === "number" ? node.angle : index * 72;
          const distance = typeof node.distance === "number" ? node.distance : 46;
          const nodeStyle = {
            "--node-angle": `${angle}deg`,
            "--node-distance": `${distance}px`
          } as CSSProperties;

          return (
            <span
              className="map-node"
              key={`${index}_${formatPayloadValue(node.label)}`}
              style={nodeStyle}
            >
              {formatPayloadValue(node.label ?? "Node")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SimulationSurface({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return <PayloadPreview payload={payload} />;
  }

  const steps = Array.isArray(payload.steps) ? payload.steps.filter(isRecord) : [];

  return (
    <div
      className="cognitive-surface simulation-surface"
      data-testid="simulation-surface"
    >
      <div className="portal-strip">
        <span>simulation</span>
        <span>{formatPayloadValue(payload.status ?? "queued")}</span>
      </div>
      <h3>{formatPayloadValue(payload.simulationTitle ?? "Simulation")}</h3>
      <ol>
        {steps.slice(0, 4).map((step, index) => (
          <li key={`${index}_${formatPayloadValue(step.label ?? "step")}`}>
            <span>{formatPayloadValue(step.label ?? `Step ${index + 1}`)}</span>
            <strong>
              {formatPayloadValue(step.value ?? step.outcome ?? "Pending")}
            </strong>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MemorySurface({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return <PayloadPreview payload={payload} />;
  }

  const notes = Array.isArray(payload.notes) ? payload.notes : [];
  const records = Array.isArray(payload.records)
    ? payload.records.filter(isRecord)
    : [];
  const retrieval = isRecord(payload.retrieval) ? payload.retrieval : undefined;
  const recallResults = Array.isArray(retrieval?.results)
    ? retrieval.results.filter(isRecord)
    : [];
  const review = isRecord(payload.review) ? payload.review : undefined;
  const reviewRecords = Array.isArray(review?.records)
    ? review.records.filter(isRecord)
    : [];

  return (
    <div className="cognitive-surface memory-surface" data-testid="memory-surface">
      <div className="portal-strip">
        <span>memory</span>
        <span>{formatPayloadValue(payload.status ?? "private")}</span>
      </div>
      <p>{formatPayloadValue(payload.policy ?? "local-first")}</p>
      {retrieval ? (
        <div className="memory-recall" aria-label="Memory recall results">
          <span>Recall</span>
          <strong>{formatPayloadValue(retrieval.query ?? "memory")}</strong>
          {recallResults.length > 0 ? (
            <ol className="memory-records">
              {recallResults.slice(0, 4).map((result) => (
                <li key={formatPayloadValue(result.id)}>
                  <span>{formatPayloadValue(result.reason ?? "matched")}</span>
                  <strong>{formatPayloadValue(result.summary ?? "")}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <em>No approved local memory matched.</em>
          )}
        </div>
      ) : null}
      {review ? (
        <div className="memory-recall" aria-label="Cross-thread memory review">
          <span>Cross-thread review</span>
          <strong>
            {formatPayloadValue(review.recordCount ?? 0)} approved across{" "}
            {formatPayloadValue(review.threadCount ?? 0)} thread
          </strong>
          {reviewRecords.length > 0 ? (
            <ol className="memory-records">
              {reviewRecords.slice(0, 6).map((record) => (
                <li key={formatPayloadValue(record.id)}>
                  <span>{formatPayloadValue(record.threadId ?? "thread")}</span>
                  <strong>{formatPayloadValue(record.summary ?? "")}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <em>No approved local memories to review.</em>
          )}
        </div>
      ) : null}
      {records.length > 0 ? (
        <ol className="memory-records" aria-label="Local memory records">
          {records.slice(0, 4).map((record) => (
            <li key={formatPayloadValue(record.id)}>
              <span>{formatPayloadValue(record.status ?? "record")}</span>
              <strong>{formatPayloadValue(record.summary ?? "")}</strong>
            </li>
          ))}
        </ol>
      ) : null}
      <ul>
        {notes.slice(0, 4).map((note, index) => (
          <li key={`${index}_${formatPayloadValue(note)}`}>
            {formatPayloadValue(note)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayloadPreview({ payload }: { payload: unknown }) {
  if (!isRecord(payload)) {
    return null;
  }

  const preferredList = findPreferredList(payload);

  if (preferredList) {
    return (
      <ul className="object-list">
        {preferredList.slice(0, 5).map((item, index) => (
          <li key={`${index}_${formatPayloadValue(item)}`}>
            {formatPayloadValue(item)}
          </li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(payload).slice(0, 3);

  return (
    <dl className="object-facts">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{formatPayloadKey(key)}</dt>
          <dd>{formatPayloadValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ObjectAnnotations({ object }: { object: StageObject }) {
  if (!isRecord(object.payload) || !Array.isArray(object.payload.annotations)) {
    return null;
  }

  const annotations = object.payload.annotations.filter(isRecord);

  if (annotations.length === 0) {
    return null;
  }

  return (
    <dl
      className="object-facts object-annotations"
      data-testid={`object-annotations-${object.type}`}
    >
      {annotations.slice(0, 3).map((annotation, index) => (
        <div
          key={`${index}_${formatPayloadValue(annotation.value ?? annotation.label)}`}
        >
          <dt>{formatPayloadValue(annotation.label ?? "User annotation")}</dt>
          <dd>{formatPayloadValue(annotation.value ?? annotation.text ?? "")}</dd>
        </div>
      ))}
    </dl>
  );
}

function findPreferredList(payload: Record<string, unknown>): unknown[] | undefined {
  const listKeys = [
    "steps",
    "risks",
    "weeks",
    "slices",
    "clusters",
    "acceptance",
    "notes"
  ];

  for (const key of listKeys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function formatPayloadValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (isRecord(value)) {
    const label =
      value.label ?? value.objective ?? value.recommendation ?? value.status;
    return typeof label === "string" ? label : JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatPayloadValue).join(", ");
  }

  return "Structured payload";
}

function formatPayloadKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
