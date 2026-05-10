import type { StageObject } from "../domain/StageObject";

export type AmbientStageState =
  | "idle"
  | "listening"
  | "thinking"
  | "working"
  | "approval_needed";

export type StageLayoutMode = "centered" | "constellation" | "focused" | "artifact";

export type StageRenderManifest = {
  threadId: string;
  focusObjectId?: string;
  objects: StageObject[];
  ambientState: AmbientStageState;
  layoutMode: StageLayoutMode;
};
