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

export async function scanWorkspace(config = getLogManagerConfig()): Promise<ScanResult> {
  const excludePattern = createFindFilesExcludePattern(config.excludeGlobs);
  const uris = await vscode.workspace.findFiles(SUPPORTED_WORKSPACE_GLOB, excludePattern);
  const result = createEmptyScanResult(0);

  for (const uri of uris) {
    if (shouldExcludeFile(uri.fsPath, config.excludeGlobs)) {
      continue;
    }

    const document = await vscode.workspace.openTextDocument(uri);
    const scanned = scanTextDocument(document, config);
    result.entries.push(...scanned.entries);
    result.diagnostics.push(...scanned.diagnostics);
    result.scannedFiles += scanned.scannedFiles;
  }

  return result;
}
