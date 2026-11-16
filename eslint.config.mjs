import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const PACKAGES = ["app", "core", "db", "ui"];

const ALLOWED_DEPENDENCIES = {
  app: ["core", "db", "ui"],
  core: [],
  db: ["core"],
  ui: ["core"],
};

// One block per package: a later block replaces `no-restricted-imports` instead of merging it.
const boundaries = PACKAGES.map((pkg) => {
  const forbidden = PACKAGES.filter(
    (other) => other !== pkg && !ALLOWED_DEPENDENCIES[pkg].includes(other),
  );
  return {
    name: `devmentor/boundaries/${pkg}`,
    files: [`packages/${pkg}/**/*.{js,jsx,mjs,ts,tsx,mts,cts}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: forbidden.map((other) => ({
            name: `@devmentor/${other}`,
            message: `@devmentor/${pkg} must not depend on @devmentor/${other} (see AGENTS.md).`,
          })),
          patterns: [
            {
              group: ["@devmentor/*/*"],
              message: "Import other packages only through their public entry point @devmentor/<package>.",
            },
            {
              regex: "^(\\.\\./)+(app|core|db|ui)/src(/|$)",
              message: "Import other packages through @devmentor/<package>, not relative paths.",
            },
          ],
        },
      ],
    },
  };
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: { rootDir: "packages/app/" },
    },
  },
  ...boundaries,
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
  ]),
]);
