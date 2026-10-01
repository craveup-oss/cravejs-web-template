import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Pinned to this file's directory. Vitest otherwise infers the root, and
  // when the project is verified from an extracted archive on Windows it
  // inferred "/", resolving every relative test path against the filesystem
  // root -- setupFiles became "/src/test/setup.ts" and every component suite
  // failed to load.
  root: fileURLToPath(new URL(".", import.meta.url)),
  test: {
    environment: "jsdom",
    fileParallelism: false,
    include: ["src/**/*.spec.{ts,tsx}"],
    maxWorkers: 1,
    pool: "threads",
    // Resolved absolutely: a relative setup path is interpreted against
    // vitest's inferred root, which differs on Windows and resolved to
    // "/src/test/setup.ts" when the project was verified from an extracted
    // archive.
    setupFiles: [fileURLToPath(new URL("./src/test/setup.ts", import.meta.url))],
  },
});
