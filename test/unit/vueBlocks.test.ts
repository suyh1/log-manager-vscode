import { describe, expect, it } from "vitest";
import { extractVueScriptBlocks } from "../../src/core/vueBlocks";

describe("extractVueScriptBlocks", () => {
  it("extracts script and script setup blocks with source line offsets", () => {
    const source = [
      "<template>",
      "  <button>{{ label }}</button>",
      "</template>",
      "<script lang=\"ts\">",
      "console.log('options');",
      "</script>",
      "<script setup lang=\"ts\">",
      "const label = 'Save';",
      "console.warn(label);",
      "</script>"
    ].join("\n");

    const blocks = extractVueScriptBlocks(source, "Example.vue");

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      kind: "script",
      startLine: 5,
      content: "console.log('options');"
    });
    expect(blocks[1]).toMatchObject({
      kind: "scriptSetup",
      startLine: 8
    });
    expect(blocks[1].content).toContain("console.warn(label);");
  });

  it("returns diagnostics for invalid Vue SFC syntax", () => {
    const result = extractVueScriptBlocks("<template><div></template>", "Broken.vue");

    expect(result).toHaveLength(0);
  });
});
