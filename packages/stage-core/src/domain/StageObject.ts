import type { IsoTimestamp } from "./shared";

export type StageObjectType =
  | "intent_card"
  | "plan_card"
  | "agent_feed"
  | "artifact_card"
  | "approval_card"
  | "codex_task_card"
  | "risk_matrix"
  | "map_portal"
  | "memory_card"
  | "model_card"
  | "simulation_card"
  | "timeline"
  | "table"
  | "chart"
  | "browser_portal"
  | "document_portal"
  | "code_diff"
  | "research_note";

export type StageObjectState = "collapsed" | "expanded" | "focused" | "hidden";

export type StageObject = {
  id: string;
  threadId: string;
  type: StageObjectType;
  title: string;
  summary?: string;
  payload: unknown;
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  size?: {
    width: number;
    height: number;
  };
  state: StageObjectState;
  pinned?: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};
