# Log Manager

Log Manager 是一个用于管理项目中 `console.*` 调试语句的 VS Code 插件。它可以在 JavaScript、TypeScript、React 和 Vue 项目里扫描日志、插入日志、查看日志位置，并安全地批量注释、取消注释或删除日志。

> 版本要求：VS Code `1.112.0` 或更高版本。

## 支持范围

- 支持文件：`.js`、`.jsx`、`.ts`、`.tsx`、`.mjs`、`.cjs`、`.vue`
- 支持方法：`console.log`、`console.info`、`console.debug`、`console.warn`、`console.error`、`console.table`
- Vue 支持：扫描 `.vue` 文件中的 `<script>` 和 `<script setup>` 代码块
- 默认忽略：`node_modules`、`.git`、`dist`、`build`、`coverage`

## 安装和运行

本项目会生成一个 VSIX 安装包：

```bash
npm install
npm run package
```

生成后在 VS Code 中安装：

1. 打开 VS Code。
2. 打开 Extensions 视图。
3. 点击右上角 `...` 菜单。
4. 选择 `Install from VSIX...`。
5. 选择项目根目录下的 `log-manager-0.0.1.vsix`。

开发调试时，可以在本项目中按 `F5` 启动 Extension Development Host。

## 怎么使用

### 打开日志管理面板

1. 在 VS Code 中按 `Command+Shift+P`。
2. 输入并执行 `Log Manager: Open Dashboard`。
3. 面板打开后会扫描当前工作区里的 `console.*`。

面板里可以：

- 按日志类型过滤，例如只看 `error` 或 `warn`
- 按文件过滤
- 搜索日志内容、文件路径、日志参数或源码文本
- 点击日志跳转到编辑器里的真实位置
- 查看某条日志的源码、行号、是否由插件生成、是否被保护

### 插入日志

在编辑器中选中变量或把光标放在变量上，然后执行命令：

- `Log Manager: Insert Console Log`
- `Log Manager: Insert Console Info`
- `Log Manager: Insert Console Debug`
- `Log Manager: Insert Console Warn`
- `Log Manager: Insert Console Error`
- `Log Manager: Insert Console Table`

插件会在当前行下方插入日志，例如：

```ts
console.log("[LM] account.ts:12 user", user);
```

### 管理当前文件日志

在命令面板执行：

- `Log Manager: Remove Logs in Current File`
- `Log Manager: Comment Logs in Current File`
- `Log Manager: Uncomment Logs in Current File`

这些命令只作用于当前打开的文件。

### 管理整个项目日志

打开 `Log Manager: Open Dashboard` 后，可以先用搜索和过滤缩小范围，再使用面板上的操作：

- `Delete`：删除日志
- `Comment`：注释日志
- `Uncomment`：取消注释日志

执行批量操作前，插件会显示预览，列出即将影响的日志数量和位置，避免误删。

### 保护不想删除的日志

如果某条日志里包含保护标记 `log-manager:keep`，批量删除默认会跳过它：

```ts
console.log("log-manager:keep important startup info", appConfig);
```

在预览弹窗里显式选择包含保护日志时，才会处理这些日志。

## 配置项

可以在 VS Code Settings 中搜索 `Log Manager` 修改配置。

- `logManager.enabledMethods`：扫描和管理哪些 `console` 方法
- `logManager.defaultMethod`：默认插入的日志方法
- `logManager.includeFileName`：生成日志时是否包含文件名
- `logManager.includeLineNumber`：生成日志时是否包含行号
- `logManager.includeFunctionName`：预留配置，是否包含函数名
- `logManager.prefix`：生成日志的前缀，默认 `[LM]`
- `logManager.quoteStyle`：生成日志使用单引号还是双引号
- `logManager.semicolon`：生成日志末尾是否加分号
- `logManager.preserveMarker`：保护标记，默认 `log-manager:keep`
- `logManager.generatedMarker`：识别插件生成日志的标记，默认 `[LM]`
- `logManager.excludeGlobs`：工作区扫描时要排除的文件或目录

## 开发

```bash
npm install
npm run compile
npm test
```

---

# Log Manager

Log Manager is a VS Code extension for managing `console.*` debugging statements in JavaScript, TypeScript, React, and Vue projects. It can scan logs, insert logs, show log locations, and safely batch comment, uncomment, or delete logs.

> Requirement: VS Code `1.112.0` or later.

## Supported Scope

- Files: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.vue`
- Methods: `console.log`, `console.info`, `console.debug`, `console.warn`, `console.error`, `console.table`
- Vue support: scans `<script>` and `<script setup>` blocks in `.vue` files
- Default exclusions: `node_modules`, `.git`, `dist`, `build`, `coverage`

## Install and Run

Build a VSIX package:

```bash
npm install
npm run package
```

Install it in VS Code:

1. Open VS Code.
2. Open the Extensions view.
3. Click the `...` menu in the top-right corner.
4. Choose `Install from VSIX...`.
5. Select `log-manager-0.0.1.vsix` from the project root.

For development, press `F5` in this project to launch an Extension Development Host.

## How to Use

### Open the Dashboard

1. Press `Command+Shift+P` in VS Code.
2. Run `Log Manager: Open Dashboard`.
3. The dashboard scans `console.*` statements in the current workspace.

In the dashboard, you can:

- Filter by log method, such as `error` or `warn`
- Filter by file
- Search log content, file paths, argument previews, or source text
- Click a log to jump to its editor location
- Inspect source, line number, generated/manual state, and preserved state

### Insert Logs

Select a variable or place the cursor on a variable, then run one of these commands:

- `Log Manager: Insert Console Log`
- `Log Manager: Insert Console Info`
- `Log Manager: Insert Console Debug`
- `Log Manager: Insert Console Warn`
- `Log Manager: Insert Console Error`
- `Log Manager: Insert Console Table`

The extension inserts a log below the current line, for example:

```ts
console.log("[LM] account.ts:12 user", user);
```

### Manage Logs in the Current File

Run these commands from the Command Palette:

- `Log Manager: Remove Logs in Current File`
- `Log Manager: Comment Logs in Current File`
- `Log Manager: Uncomment Logs in Current File`

These commands only affect the currently open file.

### Manage Logs Across the Project

Open `Log Manager: Open Dashboard`, narrow the scope with search and filters, then use:

- `Delete`: delete logs
- `Comment`: comment logs
- `Uncomment`: uncomment logs

Before a batch operation runs, the extension shows a preview with the affected count and log locations.

### Preserve Important Logs

Logs containing the preserve marker `log-manager:keep` are skipped by destructive batch actions by default:

```ts
console.log("log-manager:keep important startup info", appConfig);
```

They are only processed when you explicitly include preserved logs in the preview dialog.

## Settings

Search for `Log Manager` in VS Code Settings.

- `logManager.enabledMethods`: console methods to scan and manage
- `logManager.defaultMethod`: default insertion method
- `logManager.includeFileName`: include file names in generated log labels
- `logManager.includeLineNumber`: include line numbers in generated log labels
- `logManager.includeFunctionName`: reserved setting for function-name labels
- `logManager.prefix`: generated log prefix, default `[LM]`
- `logManager.quoteStyle`: single or double quotes
- `logManager.semicolon`: append semicolons to generated logs
- `logManager.preserveMarker`: preserve marker, default `log-manager:keep`
- `logManager.generatedMarker`: marker for generated logs, default `[LM]`
- `logManager.excludeGlobs`: files or folders excluded from workspace scanning

## Development

```bash
npm install
npm run compile
npm test
```
