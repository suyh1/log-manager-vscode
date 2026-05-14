import { LOG_METHODS, LogEntry, LogMethod, LogSummary } from "../src/domain/logTypes";

export interface DashboardFilterState {
  query: string;
  methods: LogMethod[];
  filePath?: string;
  includePreserved: boolean;
}

export function filterLogs(entries: readonly LogEntry[], filters: DashboardFilterState): LogEntry[] {
  const query = filters.query.trim().toLowerCase();
  const methodSet = new Set(filters.methods);

  return entries.filter((entry) => {
    if (!filters.includePreserved && entry.isPreserved) {
      return false;
    }

    if (methodSet.size > 0 && !methodSet.has(entry.method)) {
      return false;
    }

    if (filters.filePath && entry.filePath !== filters.filePath) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [entry.method, entry.filePath, entry.preview, entry.text]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function summarizeLogs(entries: readonly LogEntry[]): LogSummary {
  const byMethod = LOG_METHODS.reduce<Record<LogMethod, number>>((counts, method) => {
    counts[method] = 0;
    return counts;
  }, {} as Record<LogMethod, number>);
  const files = new Set<string>();
  let generated = 0;
  let preserved = 0;

  for (const entry of entries) {
    byMethod[entry.method] += 1;
    files.add(entry.filePath);
    generated += entry.isGenerated ? 1 : 0;
    preserved += entry.isPreserved ? 1 : 0;
  }

  return {
    total: entries.length,
    byMethod,
    generated,
    preserved,
    files: files.size
  };
}

export function getUniqueFiles(entries: readonly LogEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.filePath))].sort((left, right) => left.localeCompare(right));
}
