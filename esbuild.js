const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  outfile: "dist/extension.js",
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info"
};

if (watch) {
  esbuild.context(options).then((context) => context.watch());
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
