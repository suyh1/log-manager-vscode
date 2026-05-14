import * as vscode from "vscode";
import { getDashboardSettings } from "../config";
import { createCommentEdits, createDeleteEdits, createUncommentEdits, LogTextEdit } from "../core/logEditor";
import { WorkspaceScanCache } from "../core/scanCache";
import { createEmptyScanResult } from "../core/logScanner";
import { LogEntry, ScanResult } from "../domain/logTypes";
import { ExtensionMessage, isWebviewMessage, WebviewMessage } from "./protocol";

type LogOperation = "delete" | "comment" | "uncomment";

class DashboardWebviewController {
  private scanResult: ScanResult = createEmptyScanResult();

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly webview: vscode.Webview,
    private readonly scanCache: WorkspaceScanCache
  ) {}

  bind(): void {
    this.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist", "webview")]
    };
    this.webview.html = this.createHtml();
    this.webview.onDidReceiveMessage((message: unknown) => {
      void this.handleMessage(message);
    });
  }

  async refresh(force = false): Promise<void> {
    this.post({ type: "scanStarted" });
    this.scanResult = force ? await this.scanCache.scanFresh() : await this.scanCache.getCachedOrScan();
    this.post({ type: "scanCompleted", result: this.scanResult, settings: getDashboardSettings() });
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
        await this.refresh(false);
        break;
      case "scanWorkspace":
        await this.refresh(true);
        break;
      case "navigateToLog":
        await this.navigateToLog(message.logId);
        break;
      case "setCurrentFileCleanupScope":
        await this.setCurrentFileCleanupScope(message.scope);
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

  private async applyOperation(logIds: readonly string[], operation: LogOperation, includePreserved: boolean): Promise<void> {
    const entries = this.scanResult.entries.filter((entry) => logIds.includes(entry.id));

    if (entries.length === 0) {
      this.post({ type: "error", message: "No matching logs were found for this operation." });
      return;
    }

    await applyLogOperation(entries, operation, includePreserved);
    this.scanCache.invalidate();
    await this.refresh(true);
    this.post({
      type: "operationCompleted",
      result: this.scanResult,
      settings: getDashboardSettings(),
      message: "Log operation completed."
    });
  }

  private async setCurrentFileCleanupScope(scope: "generated" | "all"): Promise<void> {
    await vscode.workspace.getConfiguration("logManager").update(
      "currentFileCleanupScope",
      scope,
      vscode.ConfigurationTarget.Global
    );
    this.post({
      type: "configurationUpdated",
      settings: getDashboardSettings(),
      message: scope === "generated"
        ? "快捷清除当前文件时：只清除插件生成的日志。"
        : "快捷清除当前文件时：清除所有 console 日志。"
    });
  }

  private post(message: ExtensionMessage): void {
    void this.webview.postMessage(message);
  }

  private createHtml(): string {
    const nonce = createNonce();
    const scriptUri = this.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.js"));
    const styleUri = this.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.css"));

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.webview.cspSource}; script-src 'nonce-${nonce}';">
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

export class DashboardPanel {
  private static current: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly controller: DashboardWebviewController;

  static show(extensionUri: vscode.Uri, scanCache: WorkspaceScanCache, forceScan = false): void {
    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal(vscode.ViewColumn.One);
      void DashboardPanel.current.controller.refresh(forceScan);
      return;
    }

    DashboardPanel.current = new DashboardPanel(extensionUri, scanCache);
  }

  private constructor(extensionUri: vscode.Uri, scanCache: WorkspaceScanCache) {
    this.panel = vscode.window.createWebviewPanel("logManager.dashboard", "Log Manager", vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist", "webview")]
    });
    this.controller = new DashboardWebviewController(extensionUri, this.panel.webview, scanCache);
    this.controller.bind();

    this.panel.onDidDispose(() => {
      DashboardPanel.current = undefined;
    });
  }
}

export class DashboardViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "logManager.dashboardView";
  private controller: DashboardWebviewController | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly scanCache: WorkspaceScanCache
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.controller = new DashboardWebviewController(this.extensionUri, webviewView.webview, this.scanCache);
    this.controller.bind();
    void this.controller.refresh(false);
  }
}

export async function applyLogOperation(
  entries: readonly LogEntry[],
  operation: LogOperation,
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
  operation: LogOperation,
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
