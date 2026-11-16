import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const UNIT = "src/**/*.test.{ts,tsx}";
const DB_INTEGRATION = "src/**/*.int.test.ts";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      // Globs are matched per project root (packages/<name>), hence the leading **.
      include: ["**/src/**/*.{ts,tsx}"],
      // Everything else in src must be 100% unit-covered. Extending this list needs the user's approval.
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "**/src/migrations/**", "**/src/testing/**"],
      reporter: ["text", "json-summary"],
      thresholds: { 100: true, perFile: true },
    },
    projects: [
      {
        test: {
          name: "core",
          root: "packages/core",
          environment: "node",
          include: [UNIT],
          exclude: [DB_INTEGRATION],
        },
      },
      {
        test: {
          name: "db",
          root: "packages/db",
          environment: "node",
          include: [UNIT],
          exclude: [DB_INTEGRATION],
        },
      },
      { test: { name: "ui", root: "packages/ui", environment: "jsdom", include: [UNIT] } },
      {
        resolve: {
          // Outside a Next build "server-only" throws on import; unit tests are not client code.
          alias: {
            "server-only": fileURLToPath(
              new URL("./node_modules/server-only/empty.js", import.meta.url),
            ),
          },
        },
        test: {
          name: "app",
          root: "packages/app",
          environment: "jsdom",
          include: [UNIT],
        },
      },
      {
        test: {
          name: "db-int",
          root: "packages/db",
          environment: "node",
          include: [DB_INTEGRATION],
          globalSetup: ["src/testing/global-setup.ts"],
          fileParallelism: false,
          hookTimeout: 120_000,
        },
      },
      {
        test: {
          name: "app-int",
          root: "packages/app",
          environment: "node",
          include: ["integration/**/*.int.test.ts"],
          globalSetup: ["integration/global-setup.ts"],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 600_000,
        },
      },
    ],
  },
});
