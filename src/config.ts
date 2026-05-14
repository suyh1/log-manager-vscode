import * as vscode from "vscode";
import { LOG_METHODS, LogMethod } from "./domain/logTypes";

export type QuoteStyle = "double" | "single";

export const DEFAULT_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**"
];

export interface LogManagerConfig {
  enabledMethods: LogMethod[];
  defaultMethod: LogMethod;
  includeFileName: boolean;
  includeLineNumber: boolean;
  includeFunctionName: boolean;
  prefix: string;
  quoteStyle: QuoteStyle;
  semicolon: boolean;
  preserveMarker: string;
  generatedMarker: string;
  excludeGlobs: string[];
}

const defaultMethods = [...LOG_METHODS];

export function isLogMethod(value: unknown): value is LogMethod {
  return typeof value === "string" && (LOG_METHODS as readonly string[]).includes(value);
}

export function normalizeLogMethods(values: unknown): LogMethod[] {
  if (!Array.isArray(values)) {
    return defaultMethods;
  }

  const normalized = values.reduce<LogMethod[]>((methods, value) => {
    if (isLogMethod(value) && !methods.includes(value)) {
      methods.push(value);
    }

    return methods;
  }, []);

  return normalized.length > 0 ? normalized : defaultMethods;
}

function normalizeDefaultMethod(value: unknown, enabledMethods: LogMethod[]): LogMethod {
  return isLogMethod(value) && enabledMethods.includes(value) ? value : enabledMethods[0] ?? "log";
}

function normalizeQuoteStyle(value: unknown): QuoteStyle {
  return value === "single" ? "single" : "double";
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return normalized.length > 0 ? normalized : fallback;
}

export function getLogManagerConfig(): LogManagerConfig {
  const configuration = vscode.workspace.getConfiguration("logManager");
  const enabledMethods = normalizeLogMethods(configuration.get("enabledMethods", defaultMethods));

  return {
    enabledMethods,
    defaultMethod: normalizeDefaultMethod(configuration.get("defaultMethod", "log"), enabledMethods),
    includeFileName: configuration.get("includeFileName", true),
    includeLineNumber: configuration.get("includeLineNumber", true),
    includeFunctionName: configuration.get("includeFunctionName", false),
    prefix: configuration.get("prefix", "[LM]"),
    quoteStyle: normalizeQuoteStyle(configuration.get("quoteStyle", "double")),
    semicolon: configuration.get("semicolon", true),
    preserveMarker: configuration.get("preserveMarker", "log-manager:keep"),
    generatedMarker: configuration.get("generatedMarker", "[LM]"),
    excludeGlobs: normalizeStringArray(configuration.get("excludeGlobs", DEFAULT_EXCLUDE_GLOBS), DEFAULT_EXCLUDE_GLOBS)
  };
}
