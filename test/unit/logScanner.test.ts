import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "../../src/config";
import { scanSource, scanWorkspaceFiles } from "../../src/core/logScanner";

describe("scanSource", () => {
  it("scans JavaScript and TypeScript files", () => {
    const result = scanSource({
      uri: "file:///project/src/index.ts",
      filePath: "/project/src/index.ts",
      text: "console.log('[LM] ready');",
      config: createDefaultConfig()
    });

    expect(result.scannedFiles).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].method).toBe("log");
  });

  it("scans Vue files through script blocks", () => {
    const result = scanSource({
      uri: "file:///project/src/App.vue",
      filePath: "/project/src/App.vue",
      text: ["<template><div /></template>", "<script setup>", "console.warn('hi');", "</script>"].join("\n"),
      config: createDefaultConfig()
    });

    expect(result.scannedFiles).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ method: "warn", range: { start: { line: 3 } } });
  });

  it("returns an empty scan result for unsupported files", () => {
    const result = scanSource({
      uri: "file:///project/src/styles.css",
      filePath: "/project/src/styles.css",
      text: "console.log('nope')",
      config: createDefaultConfig()
    });

    expect(result).toEqual({
      entries: [],
      diagnostics: [],
      scannedFiles: 0
    });
  });

  it("scans workspace files concurrently and records read failures as diagnostics", async () => {
    let activeReads = 0;
    let maxActiveReads = 0;
    const result = await scanWorkspaceFiles(
      [
        {
          uri: "file:///project/a.ts",
          filePath: "/project/a.ts",
          readText: async () => {
            activeReads += 1;
            maxActiveReads = Math.max(maxActiveReads, activeReads);
            await new Promise((resolve) => setTimeout(resolve, 5));
            activeReads -= 1;
            return "console.log('[LM] a');";
          }
        },
        {
          uri: "file:///project/b.ts",
          filePath: "/project/b.ts",
          readText: async () => {
            activeReads += 1;
            maxActiveReads = Math.max(maxActiveReads, activeReads);
            await new Promise((resolve) => setTimeout(resolve, 5));
            activeReads -= 1;
            return "console.error('b');";
          }
        },
        {
          uri: "file:///project/broken.ts",
          filePath: "/project/broken.ts",
          readText: async () => {
            throw new Error("read failed");
          }
        }
      ],
      createDefaultConfig(),
      2
    );

    expect(maxActiveReads).toBe(2);
    expect(result.scannedFiles).toBe(2);
    expect(result.entries.map((entry) => entry.method)).toEqual(["log", "error"]);
    expect(result.diagnostics).toEqual([
      {
        uri: "file:///project/broken.ts",
        filePath: "/project/broken.ts",
        message: "read failed"
      }
    ]);
  });
});
