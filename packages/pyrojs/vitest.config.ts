import { defineConfig } from "vitest/config"

// Default to the fast `node` environment. DOM-dependent suites opt in per-file
// with a `// @vitest-environment happy-dom` pragma at the top of the file.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
  },
})
