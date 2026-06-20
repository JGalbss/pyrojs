import { readFile, writeFile } from "node:fs/promises"
import { defineConfig } from "tsup"

// esbuild strips top-level "use client" directives during code-splitting, so we
// prepend it to the built React entry afterwards (only that entry needs it).
const addUseClient = async (): Promise<void> => {
  for (const file of ["dist/react.js", "dist/react.cjs"]) {
    const content = await readFile(file, "utf8")
    if (!content.startsWith('"use client"')) {
      await writeFile(file, `"use client";\n${content}`)
    }
  }
}

// Three independent entry points so consumers only pay for what they import:
//   pyrojs        -> the zero-dependency core engine (hot path, plain TS)
//   pyrojs/react  -> React bindings (react is an external peer dep)
//   pyrojs/show   -> Effect-TS choreography DSL (effect is an external peer dep)
export default defineConfig({
  entry: {
    index: "src/index.ts",
    react: "src/react.tsx",
    show: "src/show.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: "es2020",
  external: ["react", "react-dom", "react/jsx-runtime", "effect"],
  onSuccess: addUseClient,
})
