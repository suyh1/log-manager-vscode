import { basename } from "node:path";
import { LogManagerConfig } from "../config";
import { LogMethod } from "../domain/logTypes";

export interface ConsoleStatementInput {
  expression: string;
  method: LogMethod;
  filePath: string;
  line: number;
  config: LogManagerConfig;
}

export interface InsertionTextInput extends ConsoleStatementInput {
  indent?: string;
}

export function createConsoleStatement(input: ConsoleStatementInput): string {
  const quote = input.config.quoteStyle === "single" ? "'" : "\"";
  const label = escapeForQuote(createLabel(input), quote);
  const semicolon = input.config.semicolon ? ";" : "";

  return `console.${input.method}(${quote}${label}${quote}, ${input.expression})${semicolon}`;
}

export function createInsertionText(input: InsertionTextInput): string {
  return `${input.indent ?? ""}${createConsoleStatement(input)}\n`;
}

function createLabel(input: ConsoleStatementInput): string {
  const parts = [input.config.prefix];

  if (input.config.includeFileName) {
    const filePart = input.config.includeLineNumber
      ? `${basename(input.filePath)}:${input.line}`
      : basename(input.filePath);
    parts.push(filePart);
  } else if (input.config.includeLineNumber) {
    parts.push(`line:${input.line}`);
  }

  parts.push(input.expression);

  return parts.filter(Boolean).join(" ");
}

function escapeForQuote(value: string, quote: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);
}
