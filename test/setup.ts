import { vi } from "vitest";

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: unknown) => defaultValue)
    }))
  },
  window: {
    showInformationMessage: vi.fn()
  },
  commands: {
    registerCommand: vi.fn((_command: string, callback: unknown) => ({
      dispose: vi.fn(),
      callback
    }))
  }
}));
