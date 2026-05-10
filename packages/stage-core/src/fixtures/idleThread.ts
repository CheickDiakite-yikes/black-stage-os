import type { IntentThread } from "../domain/IntentThread";

export function createIdleIntentThread(now = new Date().toISOString()): IntentThread {
  return {
    id: "thread_idle_stage",
    title: "Idle Stage",
    originalIntent: "",
    currentObjective: "Awaiting intent.",
    status: "paused",
    createdAt: now,
    updatedAt: now,
    renderObjects: [],
    agentEvents: [],
    artifacts: [],
    approvals: [],
    memoryNotes: [],
    decisions: []
  };
}
