export type MemoryWritePolicy = {
  allowSensitiveContent: false;
  requiresUserApproval: true;
};

export function createDefaultMemoryPolicy(): MemoryWritePolicy {
  return {
    allowSensitiveContent: false,
    requiresUserApproval: true
  };
}
