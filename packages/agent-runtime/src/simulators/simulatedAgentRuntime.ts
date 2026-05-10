import {
  createApprovedScenarioStageEvents,
  createScenarioStageEvents,
  createScenarioThread,
  getStageShellScenario,
  resolveStageShellScenario,
  type IntentThread,
  type StageShellScenario,
  type StageShellScenarioId,
  type TimedStageEvent
} from "@blackstage/stage-core";
import { createBuildBlackstageHarnessStageEvents } from "../harness/harnessStageProjection";

export type SimulatedAgentRuntime = {
  mode: "simulated";
  externalActionsEnabled: false;
};

export type SimulatedStageRunInput = {
  intentText: string;
  scenarioId?: StageShellScenarioId;
  submittedAt?: string;
  sessionId?: string;
};

export type SimulatedStageRun = {
  runtime: SimulatedAgentRuntime;
  scenario: StageShellScenario;
  thread: IntentThread;
  steps: TimedStageEvent[];
};

export function createSimulatedAgentRuntime(): SimulatedAgentRuntime {
  return {
    mode: "simulated",
    externalActionsEnabled: false
  };
}

export function createSimulatedStageRun(input: SimulatedStageRunInput): SimulatedStageRun {
  const runtime = createSimulatedAgentRuntime();
  const scenario = input.scenarioId
    ? getStageShellScenario(input.scenarioId)
    : resolveStageShellScenario(input.intentText);
  const submittedAt = input.submittedAt ?? new Date().toISOString();
  const thread = createScenarioThread(
    scenario,
    input.intentText || scenario.intent,
    submittedAt,
    input.sessionId
  );

  return {
    runtime,
    scenario,
    thread,
    steps: createScenarioStageEvents(scenario, thread, submittedAt)
  };
}

export function createSimulatedApprovalContinuation(
  scenario: StageShellScenario,
  resolvedAt = new Date().toISOString()
): TimedStageEvent[] {
  const approvedEvents = createApprovedScenarioStageEvents(scenario, resolvedAt);

  if (scenario.id !== "build_blackstage") {
    return approvedEvents;
  }

  return [
    ...approvedEvents,
    ...createBuildBlackstageHarnessStageEvents(scenario.threadId, resolvedAt)
  ];
}
