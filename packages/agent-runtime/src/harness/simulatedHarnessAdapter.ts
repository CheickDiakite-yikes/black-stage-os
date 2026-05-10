import type {
  HarnessAdapter,
  HarnessRunResult,
  HarnessTask,
  HarnessTaskKind
} from "./harnessTypes";

export function createSimulatedHarnessAdapter(
  accepts: HarnessTaskKind[] = ["codex", "agent", "research", "artifact"]
): HarnessAdapter {
  return {
    id: "simulated_harness_adapter",
    label: "Simulated harness adapter",
    mode: "simulated",
    accepts,
    canRun: (task) => accepts.includes(task.kind),
    run: (task) => createSimulatedHarnessResult(task)
  };
}

function createSimulatedHarnessResult(task: HarnessTask): HarnessRunResult {
  return {
    status: "completed",
    summary: `Completed simulated ${task.kind} task: ${task.title}`,
    events: [
      {
        type: "task.progress",
        summary: "Loaded task brief and workspace boundary.",
        payload: {
          objective: task.objective,
          workspace_path: task.workspace?.path
        }
      },
      {
        type: "task.progress",
        summary: "Produced local proof of work without external side effects.",
        payload: {
          simulated: true
        }
      }
    ]
  };
}
