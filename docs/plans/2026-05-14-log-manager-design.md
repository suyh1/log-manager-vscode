# Log Manager Design

## Product Direction

Log Manager is a VS Code extension for managing JavaScript and TypeScript `console.*` statements from one visual workspace. It combines smart log insertion with a full Webview management panel for scanning, filtering, previewing, navigating, commenting, uncommenting, and deleting logs.

The first version focuses on:

- JavaScript, TypeScript, JSX, TSX, Vue SFC script blocks, `.mjs`, and `.cjs`.
- `console.log`, `console.info`, `console.debug`, `console.warn`, `console.error`, and `console.table`.
- Workspace-wide management, not only current-editor utilities.
- Safe bulk operations through previews and preservation markers.

PHP and non-`console.*` logging APIs are intentionally outside the first release scope.

## Research Summary

Turbo Console Log establishes the category expectation: fast generated log insertion, configurable output format, and current-file log cleanup. Its Pro product expands into workspace tree views, search, filters, context actions, hide rules, and mass cleanup.

Related extensions tend to cover one slice: current-file insertion, basic deletion, or method-specific cleanup. The opportunity is to ship a coherent JS/TS-first workspace console manager with a polished Webview experience and safe cleanup defaults.

## Recommended Approach

Use a full Webview dashboard as the primary experience, backed by VS Code commands for quick editor actions.

Trade-offs:

- Pros: richer filtering/search, previewable batch operations, clearer workspace state, more room for future analytics and presets.
- Cons: more implementation complexity than a TreeView-only plugin, requires message passing, state management, and Webview asset bundling.

The Webview should still feel like a developer tool, not a marketing panel: dense, keyboard-friendly, responsive, and optimized for repeated cleanup workflows.

## User Experience

### Entry Points

- Activity bar view container: "Log Manager".
- Command palette:
  - `Log Manager: Open Dashboard`
  - `Log Manager: Insert Console Log`
  - `Log Manager: Insert Console Warn`
  - `Log Manager: Insert Console Error`
  - `Log Manager: Scan Workspace`
  - `Log Manager: Remove Logs in Current File`
  - `Log Manager: Remove Logs in Workspace`
  - `Log Manager: Comment Logs in Current File`
  - `Log Manager: Uncomment Logs in Current File`

### Dashboard Layout

The Webview uses three zones:

1. Left rail: workspace summary, method filter toggles, file filter, preservation toggle.
2. Main list: grouped log results with method, file, line, argument preview, generated/manual marker, and actions.
3. Detail panel: selected log context, raw source snippet, and operation preview.

The dashboard includes search, method chips, scope controls, refresh, and batch action buttons. Batch deletion should show a confirmation preview with counts and affected files before applying edits.

### Editor Workflow

When a developer selects text or places the cursor on an expression, insertion commands create a formatted log near the target statement. Multi-cursor insertion is supported.

Generated logs include a hidden marker in the label by default, for example:

```ts
console.log("[LM] file.ts:12 user", user);
```

Users may configure the prefix, quote style, semicolon usage, and whether to include file, line, function, and class context.

### Safety Rules

- Logs containing `log-manager:keep` are skipped by default in bulk destructive operations.
- Workspace deletion requires a preview/confirmation.
- Scanner should ignore `node_modules`, `.git`, `dist`, `build`, `coverage`, and user-configured globs.
- Parser failures should degrade gracefully: show the file as skipped with an error reason instead of failing the whole scan.

## Architecture

### Extension Host

The extension host owns filesystem access, document edits, VS Code commands, and workspace scanning.

Core modules:

- `src/extension.ts`: activation, command registration, dashboard lifecycle.
- `src/config.ts`: typed config reader and defaults.
- `src/domain/logTypes.ts`: shared domain types.
- `src/core/logScanner.ts`: workspace/document scanning.
- `src/core/logParser.ts`: AST parser for console calls.
- `src/core/vueBlocks.ts`: Vue script block extraction and location mapping.
- `src/core/logInserter.ts`: create insert edits for selected text/cursor expressions.
- `src/core/logEditor.ts`: delete/comment/uncomment edits.
- `src/core/workspaceFiles.ts`: workspace file discovery and ignore handling.
- `src/webview/dashboardPanel.ts`: Webview panel creation, HTML, asset URIs, message routing.

### Webview

The Webview is a React application bundled separately.

Core modules:

- `webview/App.tsx`: dashboard shell and state.
- `webview/components/*`: filter rail, toolbar, log table, detail pane, preview modal.
- `webview/vscodeApi.ts`: wrapper around `acquireVsCodeApi`.
- `webview/protocol.ts`: message contracts shared with the extension host.
- `webview/styles.css`: focused developer-tool visual system.

The Webview never edits files directly. It sends typed messages to the extension host, which performs all scans and edits, then sends updated state back.

## Data Flow

1. User opens dashboard.
2. Webview sends `scanWorkspace`.
3. Extension host discovers supported files.
4. Scanner parses files and returns `LogEntry[]` plus scan diagnostics.
5. Webview filters and presents results.
6. User triggers navigation or edit action.
7. Extension host opens documents or applies `WorkspaceEdit`.
8. Extension host rescans changed files and sends fresh results.

## Parsing Strategy

Use `@babel/parser` with plugins for TypeScript, JSX, decorators, class properties, import attributes, and modern syntax. Use `@babel/traverse` to detect `CallExpression` nodes where the callee is `console.<method>`.

For `.vue`, use `@vue/compiler-sfc` to parse SFC descriptors, scan `<script>` and `<script setup>` content separately, and map locations back to document lines.

Fallback regex scanning is not part of the first version, because it risks false positives. Parser errors are reported as diagnostics in the dashboard.

## Testing Strategy

Test-first development:

- Unit tests with Vitest for parser, Vue mapping, insertion, editing, filtering, and config behavior.
- VS Code integration smoke tests with `@vscode/test-electron` for command registration and simple document edits.
- Webview component tests can be added later if needed; first version keeps Webview logic mostly pure and tests filtering reducers/helpers with Vitest.

Manual verification:

- Compile with TypeScript.
- Run unit tests.
- Package/build Webview assets.
- Launch extension development host and test dashboard scan, navigation, insertion, and batch deletion preview.

## Configuration

Initial settings:

- `logManager.enabledMethods`
- `logManager.defaultMethod`
- `logManager.includeFileName`
- `logManager.includeLineNumber`
- `logManager.includeFunctionName`
- `logManager.prefix`
- `logManager.quoteStyle`
- `logManager.semicolon`
- `logManager.preserveMarker`
- `logManager.excludeGlobs`
- `logManager.generatedMarker`

## Future Roadmap

- Custom logger functions.
- Auto-correct generated logs after refactors.
- Timeline/statistics view.
- Saved cleanup presets.
- Framework-aware labels for React components and Vue setup blocks.
- PHP and server-side logger support.
