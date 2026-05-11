import type { MemoryNote } from "@blackstage/stage-core";

export type MemoryScope = "thread" | "project" | "user";

export type MemorySensitivity = "low" | "sensitive";

export type MemoryRecordStatus = "proposed" | "approved" | "rejected" | "deleted";

export type MemoryRecordSource = "user_requested" | "artifact" | "agent_observation";

export type MemoryVaultRecord = MemoryNote & {
  scope: MemoryScope;
  status: MemoryRecordStatus;
  source: MemoryRecordSource;
  sensitivity: MemorySensitivity;
  redactedSummary: string;
  contentHash: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  deletedAt?: string;
};

export type MemoryWriteDraftInput = {
  id?: string;
  threadId: string;
  summary: string;
  scope?: MemoryScope;
  source?: MemoryRecordSource;
  sensitivity?: MemorySensitivity;
  createdAt: string;
};

export type MemoryVaultInspection = {
  id: string;
  threadId: string;
  scope: MemoryScope;
  status: MemoryRecordStatus;
  redactedSummary: string;
  sensitivity: MemorySensitivity;
  source: MemoryRecordSource;
  createdAt: string;
  updatedAt: string;
};

export type MemoryVaultSnapshot = {
  version: 1;
  records: MemoryVaultRecord[];
  exportedAt: string;
};

export type MemoryStore = {
  listNotes(threadId: string): Promise<MemoryNote[]>;
  inspectRecords(threadId: string): Promise<MemoryVaultInspection[]>;
};

export class LocalMemoryVault implements MemoryStore {
  private readonly records = new Map<string, MemoryVaultRecord>();

  constructor(records: MemoryVaultRecord[] = []) {
    records.forEach((record) => {
      this.records.set(record.id, record);
    });
  }

  async listNotes(threadId: string): Promise<MemoryNote[]> {
    return this.listRecords(threadId)
      .filter((record) => record.status === "approved")
      .map(({ id, summary, createdAt }) => ({
        id,
        threadId,
        summary,
        createdAt
      }));
  }

  async inspectRecords(threadId: string): Promise<MemoryVaultInspection[]> {
    return this.listRecords(threadId).map(inspectMemoryRecord);
  }

  propose(input: MemoryWriteDraftInput): MemoryVaultRecord {
    const record = createMemoryWriteDraft(input);

    this.records.set(record.id, record);
    return record;
  }

  approve(recordId: string, approvedAt: string): MemoryVaultRecord {
    const record = this.requireRecord(recordId);
    const nextRecord = approveMemoryRecord(record, approvedAt);

    this.records.set(recordId, nextRecord);
    return nextRecord;
  }

  reject(recordId: string, rejectedAt: string): MemoryVaultRecord {
    const record = this.requireRecord(recordId);
    const nextRecord = rejectMemoryRecord(record, rejectedAt);

    this.records.set(recordId, nextRecord);
    return nextRecord;
  }

  delete(recordId: string, deletedAt: string): MemoryVaultRecord {
    const record = this.requireRecord(recordId);
    const nextRecord = deleteMemoryRecord(record, deletedAt);

    this.records.set(recordId, nextRecord);
    return nextRecord;
  }

  snapshot(exportedAt: string): MemoryVaultSnapshot {
    return createMemoryVaultSnapshot([...this.records.values()], exportedAt);
  }

  private listRecords(threadId: string): MemoryVaultRecord[] {
    return [...this.records.values()]
      .filter((record) => record.threadId === threadId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  private requireRecord(recordId: string): MemoryVaultRecord {
    const record = this.records.get(recordId);

    if (!record) {
      throw new Error(`Memory record not found: ${recordId}`);
    }

    return record;
  }
}

export function createMemoryWriteDraft(input: MemoryWriteDraftInput): MemoryVaultRecord {
  const summary = normalizeSummary(input.summary);

  return {
    id: input.id ?? `memory_${stableMemoryHash(`${input.threadId}:${summary}:${input.createdAt}`)}`,
    threadId: input.threadId,
    summary,
    scope: input.scope ?? "thread",
    status: "proposed",
    source: input.source ?? "user_requested",
    sensitivity: input.sensitivity ?? "low",
    redactedSummary: redactMemorySummary(summary),
    contentHash: stableMemoryHash(summary),
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export function approveMemoryRecord(
  record: MemoryVaultRecord,
  approvedAt: string
): MemoryVaultRecord {
  if (record.status !== "proposed") {
    throw new Error(`Only proposed memory can be approved, received ${record.status}.`);
  }

  return {
    ...record,
    status: "approved",
    approvedAt,
    updatedAt: approvedAt
  };
}

export function rejectMemoryRecord(
  record: MemoryVaultRecord,
  rejectedAt: string
): MemoryVaultRecord {
  if (record.status !== "proposed") {
    throw new Error(`Only proposed memory can be rejected, received ${record.status}.`);
  }

  return {
    ...record,
    status: "rejected",
    rejectedAt,
    updatedAt: rejectedAt
  };
}

export function deleteMemoryRecord(
  record: MemoryVaultRecord,
  deletedAt: string
): MemoryVaultRecord {
  if (record.status !== "approved") {
    throw new Error(`Only approved memory can be deleted, received ${record.status}.`);
  }

  return {
    ...record,
    status: "deleted",
    deletedAt,
    updatedAt: deletedAt
  };
}

export function inspectMemoryRecord(record: MemoryVaultRecord): MemoryVaultInspection {
  return {
    id: record.id,
    threadId: record.threadId,
    scope: record.scope,
    status: record.status,
    redactedSummary: record.redactedSummary,
    sensitivity: record.sensitivity,
    source: record.source,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function createMemoryVaultSnapshot(
  records: MemoryVaultRecord[],
  exportedAt: string
): MemoryVaultSnapshot {
  return {
    version: 1,
    records,
    exportedAt
  };
}

export function restoreMemoryVault(snapshot: MemoryVaultSnapshot): LocalMemoryVault {
  return new LocalMemoryVault(snapshot.records);
}

export function findMemoryRecordByText(
  records: MemoryVaultRecord[],
  text: string
): MemoryVaultRecord | undefined {
  const normalizedText = normalizeSummary(text).toLowerCase();

  return records
    .filter((record) => record.status === "approved")
    .find((record) => record.summary.toLowerCase().includes(normalizedText));
}

function normalizeSummary(summary: string): string {
  return summary.trim().replace(/\s+/g, " ");
}

function redactMemorySummary(summary: string): string {
  return summary
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]")
    .replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, "[sensitive-id]");
}

function stableMemoryHash(value: string): string {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return `mem_${(hash >>> 0).toString(36)}`;
}
