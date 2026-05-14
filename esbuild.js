const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const extensionOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  outfile: "dist/extension.js",
  external: ["vscode", "@vue/compiler-sfc"],
  sourcemap: true,
  logLevel: "info"
};

/** @type {import('esbuild').BuildOptions} */
const webviewOptions = {
  entryPoints: ["webview/main.tsx"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: "dist/webview/main.js",
  sourcemap: true,
  logLevel: "info"
};

if (watch) {
  Promise.all([esbuild.context(extensionOptions), esbuild.context(webviewOptions)])
    .then((contexts) => Promise.all(contexts.map((context) => context.watch())))
    .catch(() => process.exit(1));
} else {
  Promise.all([esbuild.build(extensionOptions), esbuild.build(webviewOptions)]).catch(() => process.exit(1));
}
