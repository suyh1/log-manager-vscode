import * as vscode from "vscode";
import { LogManagerConfig, getLogManagerConfig } from "../config";
import { ScanResult } from "../domain/logTypes";
import { parseConsoleLogs, parseVueConsoleLogs } from "./logParser";
import {
  SUPPORTED_WORKSPACE_GLOB,
  createFindFilesExcludePattern,
  isSupportedLogFile,
  shouldExcludeFile
} from "./workspaceFiles";

export interface SourceScanInput {
  uri: string;
  filePath: string;
  text: string;
  config: LogManagerConfig;
}

export interface WorkspaceScanFile {
  uri: string;
  filePath: string;
  readText(): Promise<string>;
}

export function createEmptyScanResult(scannedFiles = 0): ScanResult {
  return {
    entries: [],
    diagnostics: [],
    scannedFiles
  };
}

export function scanSource(input: SourceScanInput): ScanResult {
  if (!isSupportedLogFile(input.filePath)) {
    return createEmptyScanResult(0);
  }

  const parserOptions = {
    uri: input.uri,
    filePath: input.filePath,
    enabledMethods: input.config.enabledMethods,
    generatedMarker: input.config.generatedMarker,
    preserveMarker: input.config.preserveMarker
  };

  const parsed = input.filePath.toLowerCase().endsWith(".vue")
    ? parseVueConsoleLogs(input.text, parserOptions)
    : parseConsoleLogs(input.text, parserOptions);

  return {
    ...parsed,
    scannedFiles: 1
  };
}

export function scanTextDocument(document: Pick<vscode.TextDocument, "uri" | "fileName" | "getText">, config: LogManagerConfig): ScanResult {
  return scanSource({
    uri: document.uri.toString(),
    filePath: document.fileName,
    text: document.getText(),
    config
  });
}

export async function scanWorkspaceFiles(
  files: readonly WorkspaceScanFile[],
  config: LogManagerConfig,
  concurrency = 24
): Promise<ScanResult> {
  const result = createEmptyScanResult(0);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, files.length));

  async function scanNext(): Promise<void> {
    while (nextIndex < files.length) {
      const file = files[nextIndex];
      nextIndex += 1;

      try {
        const text = await file.readText();
        const scanned = scanSource({
          uri: file.uri,
          filePath: file.filePath,
          text,
          config
        });
        result.entries.push(...scanned.entries);
        result.diagnostics.push(...scanned.diagnostics);
        result.scannedFiles += scanned.scannedFiles;
      } catch (error) {
        result.diagnostics.push({
          uri: file.uri,
          filePath: file.filePath,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, scanNext));

  return result;
}

export async function scanWorkspace(config = getLogManagerConfig()): Promise<ScanResult> {
  const excludePattern = createFindFilesExcludePattern(config.excludeGlobs);
  const uris = await vscode.workspace.findFiles(SUPPORTED_WORKSPACE_GLOB, excludePattern);
  const files = uris
    .filter((uri) => !shouldExcludeFile(uri.fsPath, config.excludeGlobs))
    .map<WorkspaceScanFile>((uri) => ({
      uri: uri.toString(),
      filePath: uri.fsPath,
      readText: async () => readWorkspaceText(uri)
    }));

  return scanWorkspaceFiles(files, config);
}

async function readWorkspaceText(uri: vscode.Uri): Promise<string> {
  const openDocument = vscode.workspace.textDocuments.find((document) => document.uri.toString() === uri.toString());

  if (openDocument) {
    return openDocument.getText();
  }

  const bytes = await vscode.workspace.fs.readFile(uri);
  return Buffer.from(bytes).toString("utf8");
}
