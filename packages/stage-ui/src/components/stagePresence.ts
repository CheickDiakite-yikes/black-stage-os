export type StagePresenceTone = "idle" | "listening" | "working";

export type StagePresenceConfig = {
  tone: StagePresenceTone;
  label: string;
};

export const idleStagePresence: StagePresenceConfig = {
  tone: "idle",
  label: "Awaiting intent"
};
