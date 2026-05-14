import * as vscode from "vscode";

const placeholder = (message: string) => () => {
  void vscode.window.showInformationMessage(message);
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("logManager.openDashboard", placeholder("Log Manager dashboard is being prepared.")),
    vscode.commands.registerCommand("logManager.scanWorkspace", placeholder("Workspace scanning is being prepared.")),
    vscode.commands.registerCommand("logManager.insertLog", placeholder("Console log insertion is being prepared.")),
    vscode.commands.registerCommand("logManager.insertWarn", placeholder("Console warn insertion is being prepared.")),
    vscode.commands.registerCommand("logManager.insertError", placeholder("Console error insertion is being prepared.")),
    vscode.commands.registerCommand("logManager.removeCurrentFileLogs", placeholder("Current file cleanup is being prepared.")),
    vscode.commands.registerCommand("logManager.removeWorkspaceLogs", placeholder("Workspace cleanup is being prepared.")),
    vscode.commands.registerCommand("logManager.commentCurrentFileLogs", placeholder("Current file commenting is being prepared.")),
    vscode.commands.registerCommand("logManager.uncommentCurrentFileLogs", placeholder("Current file uncommenting is being prepared."))
  );
}

export function deactivate() {}
