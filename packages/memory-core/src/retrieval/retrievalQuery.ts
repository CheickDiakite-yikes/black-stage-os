import { inspectMemoryRecord, type MemoryVaultRecord } from "../stores/memoryStore.js";

export type RetrievalQuery = {
  threadId?: string;
  text: string;
  limit?: number;
};

export type RankedMemoryResult = ReturnType<typeof inspectMemoryRecord> & {
  score: number;
  matchedTerms: string[];
  threadMatch: boolean;
  reason: string;
};

export function rankMemoryRecords(
  records: MemoryVaultRecord[],
  query: RetrievalQuery
): RankedMemoryResult[] {
  const normalizedQuery = normalizeRetrievalText(query.text);
  const terms = tokenizeRetrievalText(normalizedQuery);

  if (terms.length === 0) {
    return [];
  }

  return records
    .filter((record) => record.status === "approved")
    .map((record) => scoreMemoryRecord(record, terms, normalizedQuery, query.threadId))
    .filter((result) => result.matchedTerms.length > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, query.limit ?? 5);
}

function scoreMemoryRecord(
  record: MemoryVaultRecord,
  terms: string[],
  normalizedQuery: string,
  threadId?: string
): RankedMemoryResult {
  const inspection = inspectMemoryRecord(record);
  const searchableText = normalizeRetrievalText(
    `${record.redactedSummary} ${record.scope} ${record.source}`
  );
  const matchedTerms = terms.filter((term) => searchableText.includes(term));
  const threadMatch = Boolean(threadId && record.threadId === threadId);
  const phraseMatch =
    normalizedQuery.length > 0 && searchableText.includes(normalizedQuery);
  const score =
    matchedTerms.length * 3 +
    (phraseMatch ? 2 : 0) +
    (threadMatch ? 2 : 0) +
    (record.scope === "project" ? 1 : 0);

  return {
    ...inspection,
    score,
    matchedTerms,
    threadMatch,
    reason:
      matchedTerms.length > 0
        ? `Matched ${matchedTerms.join(", ")}`
        : "Thread or scope boost only"
  };
}

function tokenizeRetrievalText(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(" ")
        .map((term) => term.trim())
        .filter((term) => term.length >= 3)
    )
  );
}

function normalizeRetrievalText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
