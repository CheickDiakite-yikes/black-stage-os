export type ToolAdapterStatus = "unconfigured" | "simulated" | "available";

export type ToolAdapterDescriptor = {
  id: string;
  label: string;
  status: ToolAdapterStatus;
};
