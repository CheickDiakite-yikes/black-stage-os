import type { Artifact } from "@blackstage/stage-core";

export function artifactToEditableText(artifact: Artifact): string {
  const content = artifact.content;

  if (!isRecord(content)) {
    return "";
  }

  if (typeof content.body === "string") {
    return content.body;
  }

  const preferredList = findArtifactList(content);

  if (preferredList) {
    return preferredList.map((item) => `- ${String(item)}`).join("\n");
  }

  const preferredText = content.recommendation ?? content.objective ?? content.insight;

  if (typeof preferredText === "string") {
    return preferredText;
  }

  return JSON.stringify(content, null, 2);
}

export function artifactWithEditedText(artifact: Artifact, body: string): Artifact {
  const updatedAt = new Date().toISOString();

  return {
    ...artifact,
    status: "review",
    content: {
      body,
      revisionSource: "human_edit"
    },
    updatedAt,
    provenance: [
      ...artifact.provenance,
      {
        id: `artifact_revision_${Date.now().toString(36)}`,
        label: "Human artifact revision",
        sourceType: "user_note"
      }
    ]
  };
}

export function artifactToMarkdown(artifact: Artifact): string {
  const body = artifactToEditableText(artifact);

  return [`# ${artifact.title}`, "", `Status: ${artifact.status}`, "", body].join("\n");
}

function findArtifactList(content: Record<string, unknown>): unknown[] | undefined {
  const listKeys = ["actions", "sections", "acceptanceCriteria", "insights", "nextTests"];

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
