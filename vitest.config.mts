import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@convex": fileURLToPath(new URL("./convex", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "edge-runtime",
    // convex-test runs whole mutations in-process; catalog/inbox tests take
    // 5–8s on a busy machine, which made the 5s default fail spuriously.
    testTimeout: 20_000,
    include: ["convex/**/*.test.ts", "src/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
