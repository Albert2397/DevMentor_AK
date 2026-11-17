import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const PACKAGES = ["app", "core", "db", "ui"];

const ALLOWED_DEPENDENCIES = {
  app: ["core", "db", "ui"],
  core: [],
  db: ["core"],
  ui: ["core"],
};

// Deep entry points that are part of a package's public API (see the packages' "exports").
const UI_DEEP_ENTRIES = "ui/(?:components|lib|hooks)/[^/]+$|ui/globals\\.css$";
const DB_TESTING_ENTRY = "db/testing$";

function boundaryRule(pkg, { allowDbTesting = false } = {}) {
  const forbidden = PACKAGES.filter(
    (other) => other !== pkg && !ALLOWED_DEPENDENCIES[pkg].includes(other),
  );
  const allowedDeep = allowDbTesting ? `${UI_DEEP_ENTRIES}|${DB_TESTING_ENTRY}` : UI_DEEP_ENTRIES;
  return [
    "error",
    {
      paths: forbidden.map((other) => ({
        name: `@devmentor/${other}`,
        message: `@devmentor/${pkg} must not depend on @devmentor/${other} (see AGENTS.md).`,
      })),
      patterns: [
        {
          // A regex, because gitignore-style negation cannot re-include files under an excluded path.
          regex: `^@devmentor/(?!${allowedDeep})[^/]+/.+`,
          message:
            "Import other packages only through their public entry point @devmentor/<package>.",
        },
        {
          regex: "^(\\.\\./)+(app|core|db|ui)/src(/|$)",
          message: "Import other packages through @devmentor/<package>, not relative paths.",
        },
      ],
    },
  ];
}

// One block per package: a later block replaces `no-restricted-imports` instead of merging it.
const boundaries = [
  ...PACKAGES.map((pkg) => ({
    name: `devmentor/boundaries/${pkg}`,
    files: [`packages/${pkg}/**/*.{js,jsx,mjs,ts,tsx,mts,cts}`],
    rules: { "no-restricted-imports": boundaryRule(pkg) },
  })),
  {
    // The test harness (@devmentor/db/testing) is reachable only from integration tests and tools.
    name: "devmentor/boundaries/app-integration",
    files: ["packages/app/integration/**/*.ts", "packages/app/scripts/**/*.mts"],
    rules: { "no-restricted-imports": boundaryRule("app", { allowDbTesting: true }) },
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: { rootDir: "packages/app/" },
    },
  },
  {
    name: "devmentor/type-aware",
    files: ["packages/**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    name: "devmentor/type-aware-strict",
    files: ["packages/{core,db}/**/*.ts"],
    extends: [tseslint.configs.strictTypeChecked],
  },
  {
    name: "devmentor/conventions",
    files: ["packages/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    name: "devmentor/env-access",
    files: ["packages/*/src/**/*.{ts,tsx}"],
    ignores: ["packages/app/src/env.ts", "**/*.test.{ts,tsx}", "packages/*/src/testing/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Read configuration from packages/app/src/env.ts and pass it via register<Package>().",
        },
      ],
    },
  },
  ...boundaries,
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    "**/.agents/**",
    "**/.claude/**",
  ]),
]);
