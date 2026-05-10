export type IsoTimestamp = string;

export type EvidenceRef = {
  id: string;
  label: string;
  sourceType: "document" | "url" | "artifact" | "agent_log" | "user_note";
  uri?: string;
  excerpt?: string;
};

export type MemoryNote = {
  id: string;
  threadId: string;
  summary: string;
  createdAt: IsoTimestamp;
};

export type DecisionRecord = {
  id: string;
  threadId: string;
  decision: string;
  rationale?: string;
  createdAt: IsoTimestamp;
};
