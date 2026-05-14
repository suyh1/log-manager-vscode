# Findings

## Project Context

- Workspace: `/Users/subeipo/Documents/code/VS-extension/logManager`
- Repository is empty except for `.git`.
- Current branch is `main` with no commits.

## Competitor Research

### Turbo Console Log

Sources:
- https://marketplace.visualstudio.com/items?itemName=ChakrounAnas.turbo-console-log
- https://www.turboconsolelog.io/pro
- https://www.turboconsolelog.io/documentation/overview/motivation
- https://www.turboconsolelog.io/documentation/features/insert-log-message
- https://www.turboconsolelog.io/documentation/features/delete-log-messages
- https://www.turboconsolelog.io/documentation/settings/log-function-name

Key free features:
- Smart AST-powered insertion for JavaScript and TypeScript.
- Commands for `console.log`, `console.info`, `console.debug`, `console.warn`, `console.error`, `console.table`, and custom logging functions.
- Multi-cursor insertion.
- Active-editor log management: comment, uncomment, delete, and correct generated logs.
- Configurable prefix, suffix, delimiter, quote style, semicolon, filename, line number, enclosing class, and enclosing function.

Key Pro features:
- Workspace-wide tree view of logs.
- Click-to-navigate log items.
- Mass cleanup by log type and scope.
- Real-time filtering by log method.
- Instant search by log content.
- Context actions for individual logs.
- Auto-correction after refactoring.
- Hide logs by pattern, file, or folder.
- Detection of both generated and manually written logs.
- PHP support for `var_dump`, `print_r`, `error_log`, and custom PHP logging functions.

Product opportunity:
- Build a clean, open-source-oriented extension with the core high-value workflow included: smart insertion, workspace explorer, search/filter, and safe cleanup previews.
- Avoid copying branding or proprietary implementation. Implement independently with a focused JS/TS first scope.

### Related Extensions

Sources:
- https://marketplace.visualstudio.com/items?itemName=whtouche.vscode-js-console-utils
- https://marketplace.visualstudio.com/items?itemName=simonhe.log
- https://marketplace.visualstudio.com/items?itemName=bere-systems.consolelog-manager
- https://marketplace.visualstudio.com/items?itemName=Mathiew82.broom-console
- https://marketplace.visualstudio.com/items?itemName=trunglq.magic-console-logger

Patterns observed:
- Older/simple tools focus on inserting a selected variable and deleting logs only in the current file.
- Newer tools add workspace cleanup, selective method deletion, preservation patterns, previews, and better generated log formatting.
- Preview-before-removal and preservation markers are useful differentiators for trust.

## VS Code API Notes

Sources:
- https://code.visualstudio.com/api/extension-guides/tree-view
- https://code.visualstudio.com/api/working-with-extensions/testing-extension

Relevant APIs:
- `contributes.viewsContainers` and `contributes.views` for an activity-bar log explorer.
- `TreeDataProvider` plus `window.createTreeView`/`registerTreeDataProvider` for workspace log navigation.
- `contributes.commands` and menu contribution points for command palette, editor context, view title, and item context actions.
- `WorkspaceEdit` and text document APIs for safe edits.
- `@vscode/test-electron` can run integration tests in VS Code Desktop.
