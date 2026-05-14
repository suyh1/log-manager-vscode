export const LOG_METHODS = ["log", "info", "debug", "warn", "error", "table"] as const;

export type LogMethod = (typeof LOG_METHODS)[number];

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface LogEntry {
  id: string;
  uri: string;
  filePath: string;
  method: LogMethod;
  range: SourceRange;
  text: string;
  preview: string;
  isGenerated: boolean;
  isPreserved: boolean;
}

export interface ScanDiagnostic {
  uri: string;
  filePath: string;
  message: string;
}

export interface ScanResult {
  entries: LogEntry[];
  diagnostics: ScanDiagnostic[];
  scannedFiles: number;
}

export interface LogSummary {
  total: number;
  byMethod: Record<LogMethod, number>;
  generated: number;
  preserved: number;
  files: number;
}

export interface DashboardFilters {
  query: string;
  methods: LogMethod[];
  filePath?: string;
  includePreserved: boolean;
}

export interface DashboardState {
  result: ScanResult;
  filters: DashboardFilters;
  selectedLogId?: string;
  summary: LogSummary;
}
