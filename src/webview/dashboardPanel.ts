import * as vscode from "vscode";
import { getLogManagerConfig } from "../config";
import { createCommentEdits, createDeleteEdits, createUncommentEdits, LogTextEdit } from "../core/logEditor";
import { createEmptyScanResult, scanWorkspace } from "../core/logScanner";
import { LogEntry, ScanResult } from "../domain/logTypes";
import { ExtensionMessage, isWebviewMessage, WebviewMessage } from "./protocol";

export class DashboardPanel {
  private static current: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private scanResult: ScanResult = createEmptyScanResult();

  static show(extensionUri: vscode.Uri) {
    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal(vscode.ViewColumn.One);
      void DashboardPanel.current.refresh();
      return;
    }

    DashboardPanel.current = new DashboardPanel(extensionUri);
  }

  private constructor(private readonly extensionUri: vscode.Uri) {
    this.panel = vscode.window.createWebviewPanel("logManager.dashboard", "Log Manager", vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist", "webview")]
    });

    this.panel.webview.html = this.createHtml();

    this.panel.onDidDispose(() => {
      DashboardPanel.current = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message: unknown) => {
      void this.handleMessage(message);
    });
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isWebviewMessage(message)) {
      this.post({ type: "error", message: "Received an unsupported Log Manager dashboard message." });
      return;
    }

    try {
      await this.handleWebviewMessage(message);
    } catch (error) {
      this.post({
        type: "error",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
    switch (message.type) {
      case "ready":
      case "scanWorkspace":
        await this.refresh();
        break;
      case "navigateToLog":
        await this.navigateToLog(message.logId);
        break;
      case "deleteLogs":
        await this.applyOperation(message.logIds, "delete", message.includePreserved ?? false);
        break;
      case "commentLogs":
        await this.applyOperation(message.logIds, "comment", message.includePreserved ?? false);
        break;
      case "uncommentLogs":
        await this.applyOperation(message.logIds, "uncomment", message.includePreserved ?? false);
        break;
    }
  }

  private async refresh(): Promise<void> {
    this.post({ type: "scanStarted" });
    this.scanResult = await scanWorkspace(getLogManagerConfig());
    this.post({ type: "scanCompleted", result: this.scanResult });
  }

  private async navigateToLog(logId: string): Promise<void> {
    const entry = this.scanResult.entries.find((candidate) => candidate.id === logId);

    if (!entry) {
      this.post({ type: "error", message: "The selected log no longer exists in the latest scan." });
      return;
    }

    const uri = vscode.Uri.parse(entry.uri);
    const position = new vscode.Position(entry.range.start.line - 1, entry.range.start.column);
    await vscode.window.showTextDocument(uri, {
      selection: new vscode.Range(position, position),
      preview: false
    });
  }

  private async applyOperation(
    logIds: readonly string[],
    operation: "delete" | "comment" | "uncomment",
    includePreserved: boolean
  ): Promise<void> {
    const entries = this.scanResult.entries.filter((entry) => logIds.includes(entry.id));

    if (entries.length === 0) {
      this.post({ type: "error", message: "No matching logs were found for this operation." });
      return;
    }

    await applyLogOperation(entries, operation, includePreserved);
    await this.refresh();
    this.post({ type: "operationCompleted", result: this.scanResult, message: "Log operation completed." });
  }

  private post(message: ExtensionMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private createHtml(): string {
    const nonce = createNonce();
    const scriptUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.js"));
    const styleUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.css"));

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
    <link rel="stylesheet" href="${styleUri}">
    <title>Log Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

export async function applyLogOperation(
  entries: readonly LogEntry[],
  operation: "delete" | "comment" | "uncomment",
  includePreserved = false
): Promise<void> {
  const byUri = groupEntriesByUri(entries);
  const workspaceEdit = new vscode.WorkspaceEdit();

  for (const [uriString, uriEntries] of byUri) {
    const uri = vscode.Uri.parse(uriString);
    const document = await vscode.workspace.openTextDocument(uri);
    const source = document.getText();
    const edits = createEdits(source, uriEntries, operation, includePreserved);

    for (const edit of edits) {
      workspaceEdit.replace(uri, toVscodeRange(edit), edit.newText);
    }
  }

  await vscode.workspace.applyEdit(workspaceEdit);
}

function createEdits(
  source: string,
  entries: readonly LogEntry[],
  operation: "delete" | "comment" | "uncomment",
  includePreserved: boolean
): LogTextEdit[] {
  switch (operation) {
    case "delete":
      return createDeleteEdits(source, entries, { includePreserved });
    case "comment":
      return createCommentEdits(entries, { includePreserved });
    case "uncomment":
      return createUncommentEdits(source, entries, { includePreserved });
  }
}

function toVscodeRange(edit: LogTextEdit): vscode.Range {
  return new vscode.Range(
    edit.range.start.line - 1,
    edit.range.start.column,
    edit.range.end.line - 1,
    edit.range.end.column
  );
}

function groupEntriesByUri(entries: readonly LogEntry[]): Map<string, LogEntry[]> {
  const grouped = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const group = grouped.get(entry.uri) ?? [];
    group.push(entry);
    grouped.set(entry.uri, group);
  }

  return grouped;
}

function createNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";

  for (let index = 0; index < 32; index += 1) {
    nonce += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return nonce;
}
