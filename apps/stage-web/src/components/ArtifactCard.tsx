import type { Artifact } from "@blackstage/stage-core";
import { useEffect, useMemo, useState } from "react";
import { artifactToEditableText } from "../state/artifactSerialization";

type ArtifactCardProps = {
  artifacts: Artifact[];
  onApproveArtifact: (artifactId: string) => void;
  onExportArtifact: (artifactId: string) => void;
  onPrepareArtifactAction: (artifactId: string) => void;
  onSaveArtifact: (artifactId: string, body: string) => void;
};

export function ArtifactCard({
  artifacts,
  onApproveArtifact,
  onExportArtifact,
  onPrepareArtifactAction,
  onSaveArtifact
}: ArtifactCardProps) {
  if (artifacts.length === 0) {
    return null;
  }

  return (
    <ArtifactStack
      artifacts={artifacts}
      onApproveArtifact={onApproveArtifact}
      onExportArtifact={onExportArtifact}
      onPrepareArtifactAction={onPrepareArtifactAction}
      onSaveArtifact={onSaveArtifact}
    />
  );
}

function ArtifactStack({
  artifacts,
  onApproveArtifact,
  onExportArtifact,
  onPrepareArtifactAction,
  onSaveArtifact
}: ArtifactCardProps) {
  const orderedArtifacts = useMemo(
    () =>
      [...artifacts].sort(
        (leftArtifact, rightArtifact) =>
          artifactTimestamp(rightArtifact) - artifactTimestamp(leftArtifact)
      ),
    [artifacts]
  );
  const activeArtifact = orderedArtifacts[0];
  const [draftBody, setDraftBody] = useState(() =>
    artifactToEditableText(activeArtifact)
  );

  useEffect(() => {
    setDraftBody(artifactToEditableText(activeArtifact));
  }, [activeArtifact]);

  return (
    <section
      className="artifact-stack"
      aria-label="Artifacts"
      data-testid="artifact-stack"
    >
      <article className="artifact-workbench" data-testid="artifact-workbench">
        <div className="panel-heading">
          <span>Artifact workbench</span>
          <strong>{activeArtifact.status}</strong>
        </div>
        <label htmlFor="artifact-editor">Edit artifact</label>
        <textarea
          id="artifact-editor"
          data-testid="artifact-editor"
          value={draftBody}
          onChange={(event) => setDraftBody(event.currentTarget.value)}
        />
        <div className="artifact-actions">
          <button
            type="button"
            onClick={() => onSaveArtifact(activeArtifact.id, draftBody)}
          >
            Save revision
          </button>
          <button
            type="button"
            onClick={() => onApproveArtifact(activeArtifact.id)}
            disabled={
              activeArtifact.status === "approved" ||
              activeArtifact.status === "exported"
            }
          >
            Approve artifact
          </button>
          <button type="button" onClick={() => onExportArtifact(activeArtifact.id)}>
            Export markdown
          </button>
          <button
            type="button"
            onClick={() => onPrepareArtifactAction(activeArtifact.id)}
            disabled={activeArtifact.status !== "approved"}
          >
            Prepare action
          </button>
        </div>
      </article>
      {orderedArtifacts.map((artifact) => (
        <article
          key={artifact.id}
          className={`artifact-card artifact-card-${artifact.status}`}
        >
          <div className="panel-heading">
            <span>{artifact.type.replace("_", " ")}</span>
            <strong>{artifact.status}</strong>
          </div>
          <h2>{artifact.title}</h2>
          <ArtifactContent content={artifact.content} />
          <p className="artifact-provenance">
            {artifact.provenance.length} provenance reference
          </p>
        </article>
      ))}
    </section>
  );
}

function artifactTimestamp(artifact: Artifact): number {
  const updatedAt = Date.parse(artifact.updatedAt);

  if (Number.isFinite(updatedAt)) {
    return updatedAt;
  }

  const createdAt = Date.parse(artifact.createdAt);

  return Number.isFinite(createdAt) ? createdAt : 0;
}

function ArtifactContent({ content }: { content: unknown }) {
  if (!isRecord(content)) {
    return null;
  }

  const list = findArtifactList(content);

  if (list) {
    return (
      <ul className="object-list">
        {list.slice(0, 5).map((item, index) => (
          <li key={`${index}_${String(item)}`}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <p>
      {String(
        content.recommendation ??
          content.objective ??
          content.insight ??
          "Structured artifact ready for inspection."
      )}
    </p>
  );
}

function findArtifactList(content: Record<string, unknown>): unknown[] | undefined {
  const listKeys = [
    "actions",
    "sections",
    "acceptanceCriteria",
    "insights",
    "nextTests"
  ];

  for (const key of listKeys) {
    const value = content[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
