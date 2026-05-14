import { LogEntry, SourceRange } from "../domain/logTypes";

export interface LogTextEdit {
  entryId: string;
  range: SourceRange;
  newText: string;
}

interface DestructiveEditOptions {
  includePreserved?: boolean;
}

export function createDeleteEdits(
  source: string,
  entries: readonly LogEntry[],
  options: DestructiveEditOptions = {}
): LogTextEdit[] {
  const lines = splitLines(source);

  return editableEntries(entries, options).map((entry) => {
    const startLine = entry.range.start.line;
    const endLine = entry.range.end.line;
    const canConsumeFollowingLineBreak = endLine < lines.length;

    return {
      entryId: entry.id,
      range: {
        start: { line: startLine, column: 0 },
        end: canConsumeFollowingLineBreak
          ? { line: endLine + 1, column: 0 }
          : { line: endLine, column: lines[endLine - 1]?.length ?? entry.range.end.column }
      },
      newText: ""
    };
  });
}

export function createCommentEdits(entries: readonly LogEntry[], options: DestructiveEditOptions = {}): LogTextEdit[] {
  return editableEntries(entries, options).map((entry) => ({
    entryId: entry.id,
    range: {
      start: { line: entry.range.start.line, column: 0 },
      end: { line: entry.range.start.line, column: 0 }
    },
    newText: "// "
  }));
}

export function createUncommentEdits(source: string, entries: readonly LogEntry[], options: DestructiveEditOptions = {}): LogTextEdit[] {
  const lines = splitLines(source);

  return editableEntries(entries, options).flatMap((entry) => {
    const line = lines[entry.range.start.line - 1] ?? "";
    const match = /^(\s*)\/\/\s?/.exec(line);

    if (!match) {
      return [];
    }

    const startColumn = match[1].length;

    return [
      {
        entryId: entry.id,
        range: {
          start: { line: entry.range.start.line, column: startColumn },
          end: { line: entry.range.start.line, column: match[0].length }
        },
        newText: ""
      }
    ];
  });
}

function editableEntries(entries: readonly LogEntry[], options: DestructiveEditOptions): LogEntry[] {
  return entries.filter((entry) => options.includePreserved || !entry.isPreserved);
}

function splitLines(source: string): string[] {
  return source.split(/\r?\n/);
}
