import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { CallExpression, Expression, MemberExpression, OptionalCallExpression, V8IntrinsicIdentifier } from "@babel/types";
import { LOG_METHODS, LogEntry, LogMethod, ScanDiagnostic } from "../domain/logTypes";

interface ParseConsoleLogsOptions {
  uri: string;
  filePath: string;
  enabledMethods: readonly LogMethod[];
  generatedMarker: string;
  preserveMarker: string;
  lineOffset?: number;
  columnOffset?: number;
}

interface ParseConsoleLogsResult {
  entries: LogEntry[];
  diagnostics: ScanDiagnostic[];
}

const supportedMethods = new Set<string>(LOG_METHODS);

export function parseConsoleLogs(source: string, options: ParseConsoleLogsOptions): ParseConsoleLogsResult {
  try {
    const ast = parse(source, {
      sourceType: "unambiguous",
      plugins: [
        "typescript",
        "jsx",
        "decorators-legacy",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "dynamicImport",
        "importAttributes",
        "topLevelAwait"
      ]
    });

    const entries: LogEntry[] = [];

    traverse(ast, {
      CallExpression(path) {
        const method = getConsoleMethod(path.node.callee);

        if (!method || !options.enabledMethods.includes(method)) {
          return;
        }

        const start = path.node.loc?.start;
        const end = path.node.loc?.end;

        if (!start || !end || typeof path.node.start !== "number" || typeof path.node.end !== "number") {
          return;
        }

        const text = source.slice(path.node.start, path.node.end);
        const preview = getArgumentsPreview(path.node, source);
        const lineOffset = options.lineOffset ?? 0;
        const columnOffset = options.columnOffset ?? 0;
        const startLine = start.line + lineOffset;
        const endLine = end.line + lineOffset;

        entries.push({
          id: `${options.uri}:${startLine}:${start.column + columnOffset}:${method}`,
          uri: options.uri,
          filePath: options.filePath,
          method,
          range: {
            start: {
              line: startLine,
              column: start.column + columnOffset
            },
            end: {
              line: endLine,
              column: end.column + (start.line === end.line ? columnOffset : 0)
            }
          },
          text,
          preview,
          isGenerated: options.generatedMarker.length > 0 && text.includes(options.generatedMarker),
          isPreserved: options.preserveMarker.length > 0 && text.includes(options.preserveMarker)
        });
      }
    });

    return { entries, diagnostics: [] };
  } catch (error) {
    return {
      entries: [],
      diagnostics: [
        {
          uri: options.uri,
          filePath: options.filePath,
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    };
  }
}

function getConsoleMethod(callee: CallExpression["callee"] | OptionalCallExpression["callee"]): LogMethod | undefined {
  if (!isPlainMemberExpression(callee)) {
    return undefined;
  }

  if (callee.computed || callee.object.type !== "Identifier" || callee.object.name !== "console") {
    return undefined;
  }

  if (callee.property.type !== "Identifier" || !supportedMethods.has(callee.property.name)) {
    return undefined;
  }

  return callee.property.name as LogMethod;
}

function isPlainMemberExpression(
  callee: Expression | V8IntrinsicIdentifier | MemberExpression
): callee is MemberExpression {
  return callee.type === "MemberExpression";
}

function getArgumentsPreview(node: CallExpression, source: string): string {
  return node.arguments
    .map((argument) => {
      if (typeof argument.start !== "number" || typeof argument.end !== "number") {
        return "";
      }

      return source.slice(argument.start, argument.end);
    })
    .filter(Boolean)
    .join(", ");
}
