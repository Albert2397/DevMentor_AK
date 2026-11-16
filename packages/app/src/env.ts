import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// The only module allowed to read process.env (enforced by ESLint).
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    BETTER_AUTH_SECRET: z.string().min(32, "Generate one with: openssl rand -base64 32"),
    // Optional: when unset, Better Auth derives the base URL from the incoming request.
    BETTER_AUTH_URL: z.url().optional(),
    // Optional: hosts the app is served from when there is no single BETTER_AUTH_URL (e.g. previews).
    BETTER_AUTH_ALLOWED_HOSTS: z
      .string()
      .optional()
      .transform(
        (value) =>
          value
            ?.split(",")
            .map((host) => host.trim())
            .filter(Boolean) ?? [],
      ),
    BETTER_AUTH_TRUSTED_ORIGINS: z
      .string()
      .optional()
      .transform(
        (value) =>
          value
            ?.split(",")
            .map((origin) => origin.trim())
            .filter(Boolean) ?? [],
      ),
  },
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
