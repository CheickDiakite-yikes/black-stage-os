import type { EvidenceRef, IsoTimestamp } from "./shared";

export type ArtifactType =
  | "memo"
  | "plan"
  | "brief"
  | "table"
  | "model"
  | "diagram"
  | "code"
  | "design"
  | "research_note";

export type ArtifactStatus = "draft" | "review" | "approved" | "exported";

export type Artifact = {
  id: string;
  threadId: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  contentRef?: string;
  content?: unknown;
  provenance: EvidenceRef[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};
