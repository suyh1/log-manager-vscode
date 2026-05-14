import { describe, expect, it } from "vitest";
import { filterLogs, summarizeLogs } from "../../webview/dashboardFilters";
import { LogEntry } from "../../src/domain/logTypes";

function log(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: "1",
    uri: "file:///project/src/app.ts",
    filePath: "/project/src/app.ts",
    method: "log",
    range: {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 20 }
    },
    text: "console.log('hello');",
    preview: "'hello'",
    isGenerated: false,
    isPreserved: false,
    ...overrides
  };
}

describe("dashboardFilters", () => {
  it("filters logs by query, method, file, and preserved toggle", () => {
    const entries = [
      log({ id: "1", method: "log", preview: "'user'", filePath: "/project/src/app.ts" }),
      log({ id: "2", method: "error", preview: "'payment failed'", filePath: "/project/src/pay.ts" }),
      log({ id: "3", method: "warn", preview: "'keep'", filePath: "/project/src/app.ts", isPreserved: true })
    ];

    expect(
      filterLogs(entries, {
        query: "payment",
        methods: ["error"],
        filePath: "/project/src/pay.ts",
        includePreserved: false
      }).map((entry) => entry.id)
    ).toEqual(["2"]);

    expect(
      filterLogs(entries, {
        query: "",
        methods: ["warn"],
        filePath: undefined,
        includePreserved: false
      })
    ).toEqual([]);
  });

  it("summarizes counts by method, file, generated, and preserved state", () => {
    const summary = summarizeLogs([
      log({ id: "1", method: "log", filePath: "/a.ts", isGenerated: true }),
      log({ id: "2", method: "error", filePath: "/a.ts", isPreserved: true }),
      log({ id: "3", method: "error", filePath: "/b.ts" })
    ]);

    expect(summary.total).toBe(3);
    expect(summary.byMethod.error).toBe(2);
    expect(summary.generated).toBe(1);
    expect(summary.preserved).toBe(1);
    expect(summary.files).toBe(2);
  });
});
