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

export function createDefaultConfig(): LogManagerConfig {
  return {
    enabledMethods: defaultMethods,
    defaultMethod: "log",
    includeFileName: true,
    includeLineNumber: true,
    includeFunctionName: false,
    prefix: "[LM]",
    quoteStyle: "double",
    semicolon: true,
    preserveMarker: "log-manager:keep",
    generatedMarker: "[LM]",
    excludeGlobs: DEFAULT_EXCLUDE_GLOBS
  };
}

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
  const defaults = createDefaultConfig();
  const enabledMethods = normalizeLogMethods(configuration.get("enabledMethods", defaults.enabledMethods));

  return {
    enabledMethods,
    defaultMethod: normalizeDefaultMethod(configuration.get("defaultMethod", defaults.defaultMethod), enabledMethods),
    includeFileName: configuration.get("includeFileName", defaults.includeFileName),
    includeLineNumber: configuration.get("includeLineNumber", defaults.includeLineNumber),
    includeFunctionName: configuration.get("includeFunctionName", defaults.includeFunctionName),
    prefix: configuration.get("prefix", defaults.prefix),
    quoteStyle: normalizeQuoteStyle(configuration.get("quoteStyle", defaults.quoteStyle)),
    semicolon: configuration.get("semicolon", defaults.semicolon),
    preserveMarker: configuration.get("preserveMarker", defaults.preserveMarker),
    generatedMarker: configuration.get("generatedMarker", defaults.generatedMarker),
    excludeGlobs: normalizeStringArray(configuration.get("excludeGlobs", defaults.excludeGlobs), defaults.excludeGlobs)
  };
}
