import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "../../src/config";
import { createConsoleStatement, createInsertionText } from "../../src/core/logInserter";

describe("logInserter", () => {
  it("creates a console log statement for a selected identifier", () => {
    const statement = createConsoleStatement({
      expression: "user",
      method: "log",
      filePath: "/project/src/account.ts",
      line: 12,
      config: createDefaultConfig()
    });

    expect(statement).toBe("console.log(\"[LM] account.ts:12 user\", user);");
  });

  it("respects method, quote style, prefix, and semicolon settings", () => {
    const config = {
      ...createDefaultConfig(),
      prefix: "[TRACE]",
      quoteStyle: "single" as const,
      semicolon: false,
      includeLineNumber: false
    };

    const statement = createConsoleStatement({
      expression: "total",
      method: "warn",
      filePath: "/project/src/cart.ts",
      line: 3,
      config
    });

    expect(statement).toBe("console.warn('[TRACE] cart.ts total', total)");
  });

  it("omits file and line context when disabled", () => {
    const statement = createConsoleStatement({
      expression: "order.id",
      method: "error",
      filePath: "/project/src/order.ts",
      line: 9,
      config: {
        ...createDefaultConfig(),
        includeFileName: false,
        includeLineNumber: false
      }
    });

    expect(statement).toBe("console.error(\"[LM] order.id\", order.id);");
  });

  it("creates insertion text with indentation and a trailing newline", () => {
    const text = createInsertionText({
      expression: "state",
      method: "debug",
      filePath: "/project/src/store.ts",
      line: 20,
      indent: "  ",
      config: createDefaultConfig()
    });

    expect(text).toBe("  console.debug(\"[LM] store.ts:20 state\", state);\n");
  });
});
