import { describe, expect, it } from "vitest";
import { LogEntry } from "../../src/domain/logTypes";
import {
  createCommentEdits,
  createDeleteEdits,
  createUncommentEdits
} from "../../src/core/logEditor";

function entry(overrides: Partial<LogEntry>): LogEntry {
  return {
    id: "file:///app.ts:2:0:log",
    uri: "file:///app.ts",
    filePath: "/app.ts",
    method: "log",
    range: {
      start: { line: 2, column: 0 },
      end: { line: 2, column: 24 }
    },
    text: "console.log('debug');",
    preview: "'debug'",
    isGenerated: false,
    isPreserved: false,
    ...overrides
  };
}

describe("logEditor", () => {
  it("creates delete edits that remove whole log lines without touching neighbors", () => {
    const edits = createDeleteEdits("const a = 1;\nconsole.log('debug');\nreturn a;", [entry({})]);

    expect(edits).toEqual([
      {
        entryId: "file:///app.ts:2:0:log",
        range: {
          start: { line: 2, column: 0 },
          end: { line: 3, column: 0 }
        },
        newText: ""
      }
    ]);
  });

  it("skips preserved entries for destructive edits by default", () => {
    const edits = createDeleteEdits("console.log('log-manager:keep');", [
      entry({
        isPreserved: true,
        range: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 34 }
        }
      })
    ]);

    expect(edits).toEqual([]);
  });

  it("can include preserved entries when explicitly requested", () => {
    const edits = createDeleteEdits(
      "console.log('log-manager:keep');",
      [
        entry({
          isPreserved: true,
          range: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 34 }
          }
        })
      ],
      { includePreserved: true }
    );

    expect(edits).toHaveLength(1);
  });

  it("creates comment edits at the start of each log line", () => {
    const edits = createCommentEdits([entry({})]);

    expect(edits).toEqual([
      {
        entryId: "file:///app.ts:2:0:log",
        range: {
          start: { line: 2, column: 0 },
          end: { line: 2, column: 0 }
        },
        newText: "// "
      }
    ]);
  });

  it("creates uncomment edits for commented log lines", () => {
    const edits = createUncommentEdits("const a = 1;\n  // console.log('debug');", [entry({})]);

    expect(edits).toEqual([
      {
        entryId: "file:///app.ts:2:0:log",
        range: {
          start: { line: 2, column: 2 },
          end: { line: 2, column: 5 }
        },
        newText: ""
      }
    ]);
  });
});
