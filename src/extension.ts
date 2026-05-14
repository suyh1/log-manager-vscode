import * as vscode from "vscode";
import { getLogManagerConfig } from "./config";
import { filterEntriesForCurrentFileCleanup } from "./core/currentFileCleanup";
import { applyLogOperation, DashboardPanel, DashboardViewProvider } from "./webview/dashboardPanel";
import { createInsertionText } from "./core/logInserter";
import { scanTextDocument } from "./core/logScanner";
import { LogMethod } from "./domain/logTypes";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DashboardViewProvider.viewType,
      new DashboardViewProvider(context.extensionUri),
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.commands.registerCommand("logManager.openDashboard", () => DashboardPanel.show(context.extensionUri)),
    vscode.commands.registerCommand("logManager.scanWorkspace", () => DashboardPanel.show(context.extensionUri)),
    vscode.commands.registerCommand("logManager.insertLog", () => insertConsoleStatement("log")),
    vscode.commands.registerCommand("logManager.insertInfo", () => insertConsoleStatement("info")),
    vscode.commands.registerCommand("logManager.insertDebug", () => insertConsoleStatement("debug")),
    vscode.commands.registerCommand("logManager.insertWarn", () => insertConsoleStatement("warn")),
    vscode.commands.registerCommand("logManager.insertError", () => insertConsoleStatement("error")),
    vscode.commands.registerCommand("logManager.insertTable", () => insertConsoleStatement("table")),
    vscode.commands.registerCommand("logManager.removeCurrentFileLogs", () => applyCurrentFileOperation("delete")),
    vscode.commands.registerCommand("logManager.removeWorkspaceLogs", () => DashboardPanel.show(context.extensionUri)),
    vscode.commands.registerCommand("logManager.commentCurrentFileLogs", () => applyCurrentFileOperation("comment")),
    vscode.commands.registerCommand("logManager.uncommentCurrentFileLogs", () => applyCurrentFileOperation("uncomment"))
  );
}

export function deactivate() {}

async function insertConsoleStatement(method: LogMethod): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    await vscode.window.showWarningMessage("Open an editor before inserting a console statement.");
    return;
  }

  const config = getLogManagerConfig();
  const document = editor.document;

  await editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      const expression = getExpressionForSelection(document, selection);

      if (!expression) {
        continue;
      }

      const line = selection.active.line;
      const currentLine = document.lineAt(line);
      const indent = currentLine.text.match(/^\s*/)?.[0] ?? "";
      const insertAt = new vscode.Position(Math.min(line + 1, document.lineCount), 0);
      const text = createInsertionText({
        expression,
        method,
        filePath: document.fileName,
        line: line + 1,
        indent,
        config
      });

      editBuilder.insert(insertAt, text);
    }
  });
}

async function applyCurrentFileOperation(operation: "delete" | "comment" | "uncomment"): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    await vscode.window.showWarningMessage("Open an editor before managing console statements.");
    return;
  }

  const config = getLogManagerConfig();
  const result = scanTextDocument(editor.document, config);
  const entries = operation === "delete"
    ? filterEntriesForCurrentFileCleanup(result.entries, config.currentFileCleanupScope)
    : result.entries;

  if (entries.length === 0) {
    const scopeText = config.currentFileCleanupScope === "generated" ? "generated console statements" : "console statements";
    await vscode.window.showInformationMessage(`No ${scopeText} found in the current file.`);
    return;
  }

  await applyLogOperation(entries, operation);
}

function getExpressionForSelection(document: vscode.TextDocument, selection: vscode.Selection): string | undefined {
  if (!selection.isEmpty) {
    const selectedText = document.getText(selection).trim();
    return selectedText.length > 0 ? selectedText : undefined;
  }

  const wordRange = document.getWordRangeAtPosition(selection.active, /[$A-Z_a-z][$\w]*(?:\.[A-Z_a-z_$][\w$]*)*/);
  const word = wordRange ? document.getText(wordRange).trim() : "";

  return word.length > 0 ? word : undefined;
}
