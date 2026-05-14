# Changelog

## 0.1.0

- Added the Activity Bar dashboard entry and PNG extension icon.
- Added default shortcuts for inserting a generated log and clearing current-file logs.
- Added generated/manual log labels in the dashboard.
- Added current-file cleanup scope configuration for generated-only or all logs.
- Improved workspace scan performance with concurrent filesystem reads.
- Added workspace scan caching so reopening the dashboard reuses cached results until files or scan settings change.

## 0.0.1

- Added TypeScript VS Code extension scaffold.
- Added AST-powered `console.*` detection for JS, TS, JSX, TSX, module files, and Vue SFC script blocks.
- Added Webview dashboard with search, method filters, file filters, detail view, navigation, and batch operation previews.
- Added editor insertion commands and current-file log management commands.
