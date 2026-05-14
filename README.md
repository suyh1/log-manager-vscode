# Log Manager

Log Manager is a VS Code extension for finding, inserting, reviewing, and safely cleaning up `console.*` statements across JavaScript and TypeScript projects.

The extension centers on a Webview dashboard: scan the workspace, filter by method or file, search log content, open a statement in the editor, and preview batch operations before they touch source files.

## Features

- Smart insertion commands for `console.log`, `console.info`, `console.debug`, `console.warn`, `console.error`, and `console.table`.
- Workspace dashboard for `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, and Vue SFC script blocks.
- Search by method, file path, log label, argument preview, or source text.
- Method and file filters, generated/manual classification, and preserved-log filtering.
- Batch preview for delete, comment, and uncomment operations.
- Preserve marker support: logs containing `log-manager:keep` are skipped by destructive actions unless explicitly included.

## Commands

- `Log Manager: Open Dashboard`
- `Log Manager: Scan Workspace`
- `Log Manager: Insert Console Log`
- `Log Manager: Insert Console Info`
- `Log Manager: Insert Console Debug`
- `Log Manager: Insert Console Warn`
- `Log Manager: Insert Console Error`
- `Log Manager: Insert Console Table`
- `Log Manager: Remove Logs in Current File`
- `Log Manager: Remove Logs in Workspace`
- `Log Manager: Comment Logs in Current File`
- `Log Manager: Uncomment Logs in Current File`

## Settings

- `logManager.enabledMethods`
- `logManager.defaultMethod`
- `logManager.includeFileName`
- `logManager.includeLineNumber`
- `logManager.includeFunctionName`
- `logManager.prefix`
- `logManager.quoteStyle`
- `logManager.semicolon`
- `logManager.preserveMarker`
- `logManager.generatedMarker`
- `logManager.excludeGlobs`

## Development

```bash
npm install
npm run compile
npm test
```

Press `F5` in VS Code to launch an Extension Development Host.
