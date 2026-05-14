import { minimatch } from "minimatch";

export const SUPPORTED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue"] as const;
export const SUPPORTED_WORKSPACE_GLOB = "**/*.{js,jsx,ts,tsx,mjs,cjs,vue}";

export function isSupportedLogFile(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function shouldExcludeFile(filePath: string, excludeGlobs: readonly string[]): boolean {
  const normalized = normalizePath(filePath);
  return excludeGlobs.some((pattern) => minimatch(normalized, pattern, { dot: true }));
}

export function createFindFilesExcludePattern(excludeGlobs: readonly string[]): string | undefined {
  if (excludeGlobs.length === 0) {
    return undefined;
  }

  return `{${excludeGlobs.join(",")}}`;
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}
