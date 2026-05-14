import { describe, expect, it } from "vitest";
import { LogEntry } from "../../src/domain/logTypes";
import { filterEntriesForCurrentFileCleanup } from "../../src/core/currentFileCleanup";

function entry(id: string, isGenerated: boolean): LogEntry {
  return {
    id,
    uri: "file:///app.ts",
    filePath: "/app.ts",
    method: "log",
    range: {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 20 }
    },
    text: "console.log('x');",
    preview: "'x'",
    isGenerated,
    isPreserved: false
  };
}

describe("filterEntriesForCurrentFileCleanup", () => {
  it("keeps only plugin-generated logs when the cleanup scope is generated", () => {
    const entries = [entry("generated", true), entry("manual", false)];

    expect(filterEntriesForCurrentFileCleanup(entries, "generated").map((item) => item.id)).toEqual(["generated"]);
  });

  it("keeps every log when the cleanup scope is all", () => {
    const entries = [entry("generated", true), entry("manual", false)];

    expect(filterEntriesForCurrentFileCleanup(entries, "all").map((item) => item.id)).toEqual(["generated", "manual"]);
  });
});
