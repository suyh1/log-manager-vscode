import { describe, expect, it } from "vitest";
import { DEFAULT_EXCLUDE_GLOBS } from "../../src/config";
import {
  createFindFilesExcludePattern,
  isSupportedLogFile,
  shouldExcludeFile
} from "../../src/core/workspaceFiles";

describe("workspaceFiles", () => {
  it("recognizes JavaScript, TypeScript, React, module, and Vue files", () => {
    expect(isSupportedLogFile("/src/app.js")).toBe(true);
    expect(isSupportedLogFile("/src/app.jsx")).toBe(true);
    expect(isSupportedLogFile("/src/app.ts")).toBe(true);
    expect(isSupportedLogFile("/src/app.tsx")).toBe(true);
    expect(isSupportedLogFile("/src/app.mjs")).toBe(true);
    expect(isSupportedLogFile("/src/app.cjs")).toBe(true);
    expect(isSupportedLogFile("/src/App.vue")).toBe(true);
    expect(isSupportedLogFile("/src/app.css")).toBe(false);
  });

  it("matches default and user exclude globs", () => {
    expect(shouldExcludeFile("/project/node_modules/pkg/index.js", DEFAULT_EXCLUDE_GLOBS)).toBe(true);
    expect(shouldExcludeFile("/project/src/index.ts", DEFAULT_EXCLUDE_GLOBS)).toBe(false);
    expect(shouldExcludeFile("/project/.cache/generated.js", ["**/.cache/**"])).toBe(true);
  });

  it("creates a VS Code findFiles exclude pattern", () => {
    expect(createFindFilesExcludePattern(["**/node_modules/**", "**/dist/**"])).toBe("{**/node_modules/**,**/dist/**}");
  });
});
