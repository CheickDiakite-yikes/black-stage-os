export type AgentTaskStatus = "queued" | "running" | "blocked" | "completed" | "failed";

export type AgentTask = {
  id: string;
  threadId: string;
  title: string;
  status: AgentTaskStatus;
};
