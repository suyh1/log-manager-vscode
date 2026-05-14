# Task Plan

## Goal

Build a new VS Code extension that helps developers insert, inspect, filter, navigate, comment, uncomment, and remove `console.*` debugging statements across JavaScript and TypeScript projects.

## Phases

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Context and competitor research | complete | Empty project confirmed. Turbo Console Log, related extensions, and VS Code APIs researched. |
| 2. Design proposal | complete | User selected the full Webview dashboard approach. Design doc created. |
| 3. Implementation plan | complete | Implementation plan created for TypeScript extension plus React Webview. |
| 4. Scaffold extension | complete | TypeScript VS Code extension scaffold compiles with placeholder commands. |
| 5. Implement log engine | complete | Parser-backed detection covers JS/TS/JSX/TSX and Vue script blocks; scanning, editing, and insertion helpers are tested. |
| 6. Implement VS Code UI | complete | Commands and React Webview dashboard implemented with search, filters, navigation, detail view, and batch previews. |
| 7. Verify and package | complete | Compile, unit tests, production audit, and VSIX package completed. |

## Decisions

- Target project type: VS Code extension.
- Recommended stack under evaluation: TypeScript, VS Code Extension API, Babel parser/traverse/generator, esbuild, Vitest, @vscode/test-electron.
- User asked Codex to choose the technology stack.
- Initial product scope should focus on JavaScript and TypeScript `console.*` management. PHP logging is noted as a possible later extension but is outside the user's `console.log` request.
- User selected option 3: a richer Webview dashboard as the primary log management experience.
- The dashboard will use React in a VS Code Webview while the extension host performs scanning and edits.
- `@vue/compiler-sfc` remains a runtime dependency because bundling it triggers optional template-engine resolution errors in esbuild. Other UI/parser dependencies are bundled.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| No commits yet | `git log --oneline -5` | Expected for an empty project; continue without relying on history. |
| esbuild could not resolve optional template engines from `@vue/compiler-sfc` | `npm run compile` after Vue support | Marked `@vue/compiler-sfc` as external in esbuild and kept it as a production dependency. |
