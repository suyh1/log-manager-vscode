import { CurrentFileCleanupScope, LogEntry } from "../domain/logTypes";

export function filterEntriesForCurrentFileCleanup(
  entries: readonly LogEntry[],
  scope: CurrentFileCleanupScope
): LogEntry[] {
  if (scope === "all") {
    return [...entries];
  }

  return entries.filter((entry) => entry.isGenerated);
}
