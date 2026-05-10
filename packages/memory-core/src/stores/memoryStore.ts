import type { MemoryNote } from "@blackstage/stage-core";

export type MemoryStore = {
  listNotes(threadId: string): Promise<MemoryNote[]>;
};
