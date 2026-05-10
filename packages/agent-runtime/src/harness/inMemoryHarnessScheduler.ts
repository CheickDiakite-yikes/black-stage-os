import type {
  HarnessAdapter,
  HarnessEvent,
  HarnessEventType,
  HarnessRun,
  HarnessRunResult,
  HarnessSchedulerSnapshot,
  HarnessTask,
  HarnessTaskInput
} from "./harnessTypes";

export type InMemoryHarnessSchedulerOptions = {
  adapters: HarnessAdapter[];
  now?: () => string;
};

export class InMemoryHarnessScheduler {
  private readonly adapters: HarnessAdapter[];
  private readonly now: () => string;
  private readonly tasks = new Map<string, HarnessTask>();
  private readonly runs: HarnessRun[] = [];
  private readonly events: HarnessEvent[] = [];

  constructor(options: InMemoryHarnessSchedulerOptions) {
    this.adapters = options.adapters;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  enqueueTask(input: HarnessTaskInput): HarnessTask {
    const timestamp = this.now();
    const task: HarnessTask = {
      id: input.id ?? createHarnessId("task"),
      threadId: input.threadId,
      title: input.title,
      objective: input.objective,
      kind: input.kind,
      status: "queued",
      priority: input.priority ?? 0,
      approvalRequired: input.approvalRequired ?? false,
      blockedBy: input.blockedBy ?? [],
      workspace: input.workspace,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.tasks.set(task.id, task);
    this.recordEvent(task.id, "task.queued", `Queued ${task.kind} task: ${task.title}`);

    return task;
  }

  async runNext(): Promise<HarnessRun | undefined> {
    const task = this.findNextRunnableTask();

    if (!task) {
      return undefined;
    }

    if (task.approvalRequired) {
      this.updateTask(task.id, {
        status: "blocked"
      });
      this.recordEvent(task.id, "approval.required", `Approval required before ${task.title}.`, {
        reason: "approval_required"
      });
      return undefined;
    }

    const adapter = this.adapters.find((candidate) => candidate.canRun(task));

    if (!adapter) {
      this.updateTask(task.id, {
        status: "failed"
      });
      this.recordEvent(task.id, "task.failed", `No harness adapter can run ${task.kind}.`, {
        kind: task.kind
      });
      return undefined;
    }

    const startedAt = this.now();
    const run: HarnessRun = {
      id: createHarnessId("run"),
      taskId: task.id,
      adapterId: adapter.id,
      status: "running",
      startedAt
    };

    this.runs.push(run);
    this.updateTask(task.id, {
      status: "running"
    });
    this.recordEvent(task.id, "task.started", `${adapter.label} started ${task.title}.`, {
      adapter_id: adapter.id,
      run_id: run.id,
      workspace_path: task.workspace?.path
    }, run.id);

    try {
      const result = await adapter.run(task);
      return this.completeRun(run.id, result);
    } catch (error) {
      return this.completeRun(run.id, {
        status: "failed",
        summary: error instanceof Error ? error.message : "Harness adapter failed."
      });
    }
  }

  getSnapshot(): HarnessSchedulerSnapshot {
    return {
      tasks: [...this.tasks.values()],
      runs: [...this.runs],
      events: [...this.events]
    };
  }

  private findNextRunnableTask(): HarnessTask | undefined {
    return [...this.tasks.values()]
      .filter((task) => task.status === "queued")
      .filter((task) => this.taskDependenciesAreComplete(task))
      .sort((left, right) => right.priority - left.priority || left.createdAt.localeCompare(right.createdAt))[0];
  }

  private taskDependenciesAreComplete(task: HarnessTask): boolean {
    return task.blockedBy.every((taskId) => this.tasks.get(taskId)?.status === "completed");
  }

  private completeRun(runId: string, result: HarnessRunResult): HarnessRun {
    const run = this.runs.find((candidate) => candidate.id === runId);

    if (!run) {
      throw new Error(`Harness run not found: ${runId}`);
    }

    const completedAt = this.now();
    const nextRun: HarnessRun = {
      ...run,
      status: result.status,
      completedAt,
      summary: result.summary
    };

    this.replaceRun(nextRun);
    this.updateTask(run.taskId, {
      status: result.status
    });

    result.events?.forEach((event) => {
      this.recordEvent(run.taskId, event.type, event.summary, event.payload, run.id);
    });
    this.recordEvent(
      run.taskId,
      result.status === "completed" ? "task.completed" : "task.failed",
      result.summary,
      undefined,
      run.id
    );

    return nextRun;
  }

  private updateTask(taskId: string, patch: Partial<Pick<HarnessTask, "status">>): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Harness task not found: ${taskId}`);
    }

    this.tasks.set(taskId, {
      ...task,
      ...patch,
      updatedAt: this.now()
    });
  }

  private replaceRun(nextRun: HarnessRun): void {
    const index = this.runs.findIndex((run) => run.id === nextRun.id);

    if (index >= 0) {
      this.runs[index] = nextRun;
    }
  }

  private recordEvent(
    taskId: string,
    type: HarnessEventType,
    summary: string,
    payload?: Record<string, unknown>,
    runId?: string
  ): void {
    this.events.push({
      id: createHarnessId("event"),
      taskId,
      runId,
      type,
      summary,
      payload,
      timestamp: this.now()
    });
  }
}

function createHarnessId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
