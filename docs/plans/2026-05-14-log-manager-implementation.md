# Log Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a VS Code extension with smart `console.*` insertion and a full Webview dashboard for managing project logs.

**Architecture:** The extension host owns scanning, parsing, commands, file edits, and VS Code APIs. A React Webview dashboard owns presentation, filtering, preview interactions, and sends typed messages to the extension host for all privileged actions.

**Tech Stack:** TypeScript, VS Code Extension API, React, Vite, esbuild, Vitest, @vscode/test-electron, @babel/parser, @babel/traverse, @vue/compiler-sfc.

---

### Task 1: Scaffold Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `esbuild.js`
- Create: `README.md`
- Create: `.gitignore`
- Create: `src/extension.ts`
- Create: `src/domain/logTypes.ts`
- Create: `test/setup.ts`

**Steps:**

1. Create npm metadata for a VS Code extension named `log-manager`.
2. Add scripts: `compile`, `watch`, `test`, `test:unit`, `lint`, `package`.
3. Add VS Code contributes for commands, configuration, and activity bar Webview view.
4. Create a minimal activation file that registers `logManager.openDashboard`.
5. Run `npm install`.
6. Run `npm run compile`.

Expected result: extension compiles with no implementation beyond command registration.

### Task 2: Domain Types and Config

**Files:**
- Create: `src/config.ts`
- Modify: `src/domain/logTypes.ts`
- Create: `test/unit/config.test.ts`

**Steps:**

1. Write failing tests for config defaults and workspace override normalization.
2. Implement typed config reader.
3. Add log domain types: `LogMethod`, `LogEntry`, `ScanResult`, `ScanDiagnostic`, `DashboardState`.
4. Run unit tests.

Expected result: config and shared types are stable before parser work begins.

### Task 3: Parser

**Files:**
- Create: `src/core/logParser.ts`
- Create: `test/unit/logParser.test.ts`

**Steps:**

1. Write failing tests for detecting `console.log`, `warn`, `error`, `table`, and manually written logs.
2. Add tests for ignoring `consoleish.log`, nested property calls, and unsupported methods.
3. Implement Babel parser/traverse detection.
4. Add parser diagnostics for syntax errors.
5. Run parser tests.

Expected result: JS/TS/JSX/TSX console calls are detected with method, range, line, column, and preview.

### Task 4: Vue SFC Support

**Files:**
- Create: `src/core/vueBlocks.ts`
- Modify: `src/core/logParser.ts`
- Create: `test/unit/vueBlocks.test.ts`
- Create: `test/unit/logParser.vue.test.ts`

**Steps:**

1. Write failing tests for mapping `<script>` and `<script setup>` logs back to original Vue line numbers.
2. Implement SFC descriptor extraction.
3. Reuse parser on extracted blocks with line/offset mapping.
4. Run Vue parser tests.

Expected result: `.vue` files scan script blocks accurately and ignore template-only content.

### Task 5: Workspace Scanning

**Files:**
- Create: `src/core/workspaceFiles.ts`
- Create: `src/core/logScanner.ts`
- Create: `test/unit/workspaceFiles.test.ts`
- Create: `test/unit/logScanner.test.ts`

**Steps:**

1. Write failing tests for supported file matching and default exclusions.
2. Implement glob discovery helpers around VS Code APIs with isolated pure helpers.
3. Implement document and workspace scan orchestration.
4. Run scanner tests.

Expected result: scanner returns entries grouped by file plus diagnostics for skipped/error files.

### Task 6: Log Editing

**Files:**
- Create: `src/core/logEditor.ts`
- Create: `test/unit/logEditor.test.ts`

**Steps:**

1. Write failing tests for delete edits preserving neighboring lines.
2. Write failing tests for comment/uncomment edits.
3. Write failing tests for skipping entries containing the preserve marker.
4. Implement edit generation using ranges from parsed entries.
5. Run editor tests.

Expected result: destructive operations are previewable and marker-aware.

### Task 7: Smart Insertion

**Files:**
- Create: `src/core/logInserter.ts`
- Create: `test/unit/logInserter.test.ts`
- Modify: `src/extension.ts`

**Steps:**

1. Write failing tests for selected identifier insertion.
2. Add tests for semicolon, quote style, method, prefix, file name, and line number settings.
3. Implement insertion text generation and command wiring.
4. Run insertion tests.

Expected result: editor commands insert formatted logs for selections and simple cursor contexts.

### Task 8: Webview Protocol and Panel

**Files:**
- Create: `src/webview/protocol.ts`
- Create: `src/webview/dashboardPanel.ts`
- Modify: `src/extension.ts`
- Create: `test/unit/protocol.test.ts`

**Steps:**

1. Write failing tests for message type guards.
2. Implement typed message protocol.
3. Create dashboard panel with CSP, nonce, script/style asset URIs, and message routing.
4. Wire open, refresh, navigate, delete, comment, and uncomment handlers.
5. Run compile.

Expected result: extension can open a Webview and exchange typed messages.

### Task 9: React Dashboard

**Files:**
- Create: `webview/index.html`
- Create: `webview/main.tsx`
- Create: `webview/App.tsx`
- Create: `webview/vscodeApi.ts`
- Create: `webview/protocol.ts`
- Create: `webview/styles.css`
- Create: `webview/components/Toolbar.tsx`
- Create: `webview/components/FilterRail.tsx`
- Create: `webview/components/LogTable.tsx`
- Create: `webview/components/DetailPane.tsx`
- Create: `webview/components/PreviewModal.tsx`
- Create: `test/unit/dashboardFilters.test.ts`

**Steps:**

1. Write failing tests for pure filter/search helpers.
2. Implement React dashboard with a focused developer-tool visual style.
3. Implement search, method filters, file filters, preserve toggle, selection, and batch preview.
4. Add stable empty/loading/error states.
5. Run Webview build and unit tests.

Expected result: dashboard is usable and visually distinct without relying on generic template UI.

### Task 10: VS Code Integration Smoke Tests

**Files:**
- Create: `test/suite/extension.test.ts`
- Create: `test/runTest.ts`
- Modify: `package.json`

**Steps:**

1. Add `@vscode/test-electron` runner.
2. Write smoke test for extension activation and command registration.
3. Write smoke test for inserting a log into a temporary JS document.
4. Run integration tests.

Expected result: extension works in VS Code Extension Development Host.

### Task 11: Documentation and Verification

**Files:**
- Modify: `README.md`
- Create: `CHANGELOG.md`
- Create: `.vscodeignore`

**Steps:**

1. Document commands, dashboard workflow, settings, preserve marker, and first-release scope.
2. Add packaging ignore rules.
3. Run `npm run compile`.
4. Run `npm test`.
5. Run packaging build.

Expected result: extension is ready to run locally and package.
