const REDACTED_INTENT_LIMIT = 160;

export function redactIntentText(intentText: string): string {
  const normalized = intentText.trim().replace(/\s+/g, " ");

  if (normalized.length <= REDACTED_INTENT_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, REDACTED_INTENT_LIMIT)}... [redacted]`;
}
