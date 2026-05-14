import { SFCBlock, parse } from "@vue/compiler-sfc";

export type VueScriptBlockKind = "script" | "scriptSetup";

export interface VueScriptBlock {
  kind: VueScriptBlockKind;
  content: string;
  startLine: number;
  startColumn: number;
}

export function extractVueScriptBlocks(source: string, fileName: string): VueScriptBlock[] {
  const result = parse(source, { filename: fileName });

  if (result.errors.length > 0) {
    return [];
  }

  return [
    result.descriptor.script ? toScriptBlock("script", result.descriptor.script) : undefined,
    result.descriptor.scriptSetup ? toScriptBlock("scriptSetup", result.descriptor.scriptSetup) : undefined
  ].filter((block): block is VueScriptBlock => Boolean(block));
}

function toScriptBlock(kind: VueScriptBlockKind, block: SFCBlock): VueScriptBlock {
  const normalized = stripOuterBlankLines(block.content);

  return {
    kind,
    content: normalized.content,
    startLine: block.loc.start.line + normalized.removedLeadingLines,
    startColumn: normalized.removedLeadingLines > 0 ? 0 : Math.max(block.loc.start.column - 1, 0)
  };
}

function stripOuterBlankLines(content: string): { content: string; removedLeadingLines: number } {
  let next = content;
  let removedLeadingLines = 0;

  while (next.startsWith("\n") || next.startsWith("\r\n")) {
    next = next.replace(/^\r?\n/, "");
    removedLeadingLines += 1;
  }

  next = next.replace(/\r?\n\s*$/, "");

  return { content: next, removedLeadingLines };
}
