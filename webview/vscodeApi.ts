import type { WebviewMessage } from "../src/webview/protocol";

interface VsCodeApi {
  postMessage(message: WebviewMessage): void;
}

declare const acquireVsCodeApi: (() => VsCodeApi) | undefined;

const fallbackApi: VsCodeApi = {
  postMessage(message) {
    console.info("Log Manager dashboard message", message);
  }
};

export function getVsCodeApi(): VsCodeApi {
  if (typeof acquireVsCodeApi === "function") {
    return acquireVsCodeApi();
  }

  return fallbackApi;
}
