import { describe, expect, it } from "vitest";
import { parseVueConsoleLogs } from "../../src/core/logParser";
import { LOG_METHODS } from "../../src/domain/logTypes";

describe("parseVueConsoleLogs", () => {
  it("maps script and script setup logs back to Vue file lines", () => {
    const source = [
      "<template>",
      "  <div>{{ count }}</div>",
      "</template>",
      "<script lang=\"ts\">",
      "export default {",
      "  mounted() {",
      "    console.log('[LM] mounted', this.count);",
      "  }",
      "};",
      "</script>",
      "<script setup lang=\"ts\">",
      "const count = 1;",
      "console.error('log-manager:keep', count);",
      "</script>"
    ].join("\n");

    const result = parseVueConsoleLogs(source, {
      uri: "file:///project/src/Counter.vue",
      filePath: "/project/src/Counter.vue",
      enabledMethods: LOG_METHODS,
      generatedMarker: "[LM]",
      preserveMarker: "log-manager:keep"
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.entries.map((entry) => [entry.method, entry.range.start.line])).toEqual([
      ["log", 7],
      ["error", 13]
    ]);
    expect(result.entries[0].isGenerated).toBe(true);
    expect(result.entries[1].isPreserved).toBe(true);
  });
});
