import { describe, expect, it } from "vitest";
import { parseConsoleLogs } from "../../src/core/logParser";
import { LOG_METHODS } from "../../src/domain/logTypes";

const baseOptions = {
  uri: "file:///project/src/example.tsx",
  filePath: "/project/src/example.tsx",
  enabledMethods: LOG_METHODS,
  generatedMarker: "[LM]",
  preserveMarker: "log-manager:keep"
};

describe("parseConsoleLogs", () => {
  it("detects supported console methods with source positions and previews", () => {
    const result = parseConsoleLogs(
      [
        "const user = { name: 'Ada' };",
        "console.log('[LM] user', user);",
        "console.warn('careful');",
        "console.error('boom');",
        "console.table(users);"
      ].join("\n"),
      baseOptions
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.entries.map((entry) => entry.method)).toEqual(["log", "warn", "error", "table"]);
    expect(result.entries[0]).toMatchObject({
      uri: baseOptions.uri,
      filePath: baseOptions.filePath,
      method: "log",
      preview: "'[LM] user', user",
      isGenerated: true,
      isPreserved: false,
      range: {
        start: { line: 2, column: 0 }
      }
    });
  });

  it("detects preserved manually written logs", () => {
    const result = parseConsoleLogs("console.info('log-manager:keep manual note');", baseOptions);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({
      method: "info",
      isGenerated: false,
      isPreserved: true
    });
  });

  it("ignores non-console calls, nested console properties, and disabled methods", () => {
    const result = parseConsoleLogs(
      [
        "consoleish.log('not console');",
        "console.log.bind(console)('not direct');",
        "console.trace('unsupported');",
        "console.debug('disabled');",
        "console.error('enabled');"
      ].join("\n"),
      {
        ...baseOptions,
        enabledMethods: ["error"]
      }
    );

    expect(result.entries.map((entry) => entry.method)).toEqual(["error"]);
  });

  it("parses TypeScript and JSX syntax", () => {
    const result = parseConsoleLogs(
      [
        "type Props = { label: string };",
        "export const Button = ({ label }: Props) => {",
        "  console.debug(label);",
        "  return <button>{label}</button>;",
        "};"
      ].join("\n"),
      baseOptions
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].method).toBe("debug");
    expect(result.entries[0].range.start).toEqual({ line: 3, column: 2 });
  });

  it("returns diagnostics for syntax errors instead of throwing", () => {
    const result = parseConsoleLogs("const broken = ;\nconsole.log('hidden');", baseOptions);

    expect(result.entries).toEqual([]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain("Unexpected token");
  });
});
