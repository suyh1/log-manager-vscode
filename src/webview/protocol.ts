import { ScanResult } from "../domain/logTypes";

export type WebviewMessage =
  | { type: "ready" }
  | { type: "scanWorkspace" }
  | { type: "navigateToLog"; logId: string }
  | { type: "deleteLogs"; logIds: string[]; includePreserved?: boolean }
  | { type: "commentLogs"; logIds: string[]; includePreserved?: boolean }
  | { type: "uncommentLogs"; logIds: string[]; includePreserved?: boolean };

export type ExtensionMessage =
  | { type: "scanStarted" }
  | { type: "scanCompleted"; result: ScanResult }
  | { type: "operationCompleted"; result: ScanResult; message: string }
  | { type: "error"; message: string };

export function isWebviewMessage(value: unknown): value is WebviewMessage {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  switch (value.type) {
    case "ready":
    case "scanWorkspace":
      return true;
    case "navigateToLog":
      return typeof value.logId === "string";
    case "deleteLogs":
    case "commentLogs":
    case "uncommentLogs":
      return Array.isArray(value.logIds) && value.logIds.every((id) => typeof id === "string");
    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
