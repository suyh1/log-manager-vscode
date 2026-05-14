import * as vscode from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EXCLUDE_GLOBS,
  getLogManagerConfig,
  normalizeCurrentFileCleanupScope,
  normalizeLogMethods
} from "../../src/config";

const getConfiguration = vi.mocked(vscode.workspace.getConfiguration);

describe("Log Manager config", () => {
  beforeEach(() => {
    getConfiguration.mockReturnValue({
      get: vi.fn((_key: string, defaultValue: unknown) => defaultValue)
    } as unknown as vscode.WorkspaceConfiguration);
  });

  it("returns stable defaults", () => {
    const config = getLogManagerConfig();

    expect(config.enabledMethods).toEqual(["log", "info", "debug", "warn", "error", "table"]);
    expect(config.defaultMethod).toBe("log");
    expect(config.includeFileName).toBe(true);
    expect(config.includeLineNumber).toBe(true);
    expect(config.includeFunctionName).toBe(false);
    expect(config.prefix).toBe("[LM]");
    expect(config.quoteStyle).toBe("double");
    expect(config.semicolon).toBe(true);
    expect(config.preserveMarker).toBe("log-manager:keep");
    expect(config.generatedMarker).toBe("[LM]");
    expect(config.currentFileCleanupScope).toBe("generated");
    expect(config.excludeGlobs).toEqual(DEFAULT_EXCLUDE_GLOBS);
  });

  it("normalizes enabled methods by removing invalid values and duplicates", () => {
    expect(normalizeLogMethods(["warn", "nope", "error", "warn", "table"])).toEqual([
      "warn",
      "error",
      "table"
    ]);
  });

  it("falls back to all methods when enabled method overrides are empty", () => {
    expect(normalizeLogMethods(["nope"])).toEqual(["log", "info", "debug", "warn", "error", "table"]);
  });

  it("normalizes current file cleanup scope", () => {
    expect(normalizeCurrentFileCleanupScope("all")).toBe("all");
    expect(normalizeCurrentFileCleanupScope("generated")).toBe("generated");
    expect(normalizeCurrentFileCleanupScope("unknown")).toBe("generated");
  });

  it("uses workspace overrides when they are valid", () => {
    getConfiguration.mockReturnValue({
      get: vi.fn((key: string, defaultValue: unknown) => {
        const values: Record<string, unknown> = {
          enabledMethods: ["warn", "error", "warn"],
          defaultMethod: "warn",
          includeFileName: false,
          includeLineNumber: false,
          includeFunctionName: true,
          prefix: "[TRACE]",
          quoteStyle: "single",
          semicolon: false,
          preserveMarker: "keep-me",
          generatedMarker: "[TRACE]",
          currentFileCleanupScope: "all",
          excludeGlobs: ["**/.cache/**"]
        };

        return values[key] ?? defaultValue;
      })
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getLogManagerConfig();

    expect(config.enabledMethods).toEqual(["warn", "error"]);
    expect(config.defaultMethod).toBe("warn");
    expect(config.includeFileName).toBe(false);
    expect(config.includeLineNumber).toBe(false);
    expect(config.includeFunctionName).toBe(true);
    expect(config.prefix).toBe("[TRACE]");
    expect(config.quoteStyle).toBe("single");
    expect(config.semicolon).toBe(false);
    expect(config.preserveMarker).toBe("keep-me");
    expect(config.generatedMarker).toBe("[TRACE]");
    expect(config.currentFileCleanupScope).toBe("all");
    expect(config.excludeGlobs).toEqual(["**/.cache/**"]);
  });
});
