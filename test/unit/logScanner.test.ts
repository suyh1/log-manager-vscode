import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "../../src/config";
import { scanSource } from "../../src/core/logScanner";

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
});
