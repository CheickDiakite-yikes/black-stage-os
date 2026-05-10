export type SimulatedAgentRuntime = {
  mode: "simulated";
  externalActionsEnabled: false;
};

export function createSimulatedAgentRuntime(): SimulatedAgentRuntime {
  return {
    mode: "simulated",
    externalActionsEnabled: false
  };
}
