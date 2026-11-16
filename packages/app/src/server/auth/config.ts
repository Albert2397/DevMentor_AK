import { env } from "@/env";

import type { AuthConfig } from "./options";

export function authConfigFromEnv(): AuthConfig {
  return {
    databaseUrl: env.DATABASE_URL,
    poolMax: env.DATABASE_POOL_MAX,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    allowedHosts: env.BETTER_AUTH_ALLOWED_HOSTS,
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  };
}
