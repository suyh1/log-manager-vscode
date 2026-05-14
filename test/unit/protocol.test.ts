import { describe, expect, it } from "vitest";
import { isWebviewMessage } from "../../src/webview/protocol";

describe("webview protocol", () => {
  it("accepts known messages with required fields", () => {
    expect(isWebviewMessage({ type: "ready" })).toBe(true);
    expect(isWebviewMessage({ type: "scanWorkspace" })).toBe(true);
    expect(isWebviewMessage({ type: "navigateToLog", logId: "abc" })).toBe(true);
    expect(isWebviewMessage({ type: "deleteLogs", logIds: ["a"], includePreserved: false })).toBe(true);
    expect(isWebviewMessage({ type: "commentLogs", logIds: ["a"] })).toBe(true);
    expect(isWebviewMessage({ type: "uncommentLogs", logIds: ["a"] })).toBe(true);
  });

  it("rejects unknown or malformed messages", () => {
    expect(isWebviewMessage(undefined)).toBe(false);
    expect(isWebviewMessage({ type: "missing" })).toBe(false);
    expect(isWebviewMessage({ type: "navigateToLog" })).toBe(false);
    expect(isWebviewMessage({ type: "deleteLogs", logIds: "a" })).toBe(false);
  });
});
