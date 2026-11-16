import type { Options } from "@mikro-orm/postgresql";
import { defineConfig } from "@mikro-orm/postgresql";

import { UserProfileSchema } from "./entities/UserProfile";

export type DbConfig = {
  clientUrl: string;
  poolMax: number;
  debug?: boolean;
};

export const entities = [UserProfileSchema];

export const migrationsOptions = {
  path: "./src/migrations",
  pathTs: "./src/migrations",
  glob: "!(*.d).{js,ts}",
  snapshot: true,
  snapshotName: ".snapshot-devmentor",
} as const;

export function createOrmConfig(config: DbConfig): Options {
  return defineConfig({
    clientUrl: config.clientUrl,
    entities,
    pool: { min: 0, max: config.poolMax, idleTimeoutMillis: 30_000 },
    debug: config.debug ?? false,
  });
}
