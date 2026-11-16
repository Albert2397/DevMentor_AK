import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";

export type AuthConfig = {
  databaseUrl: string;
  poolMax: number;
  secret: string;
  baseURL: string | undefined;
  allowedHosts: string[];
  trustedOrigins: string[];
};

// Shared by the runtime instance and the migration script, so both see the same schema.
export function createAuthOptions(config: AuthConfig) {
  return {
    database: new Pool({ connectionString: config.databaseUrl, max: config.poolMax }),
    secret: config.secret,
    baseURL:
      config.baseURL ??
      (config.allowedHosts.length > 0
        ? { allowedHosts: config.allowedHosts, protocol: "auto" as const }
        : undefined),
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
  } satisfies BetterAuthOptions;
}
