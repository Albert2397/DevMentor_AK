import { fileURLToPath } from "node:url";

import { Migrator } from "@mikro-orm/migrations";
import { MikroORM } from "@mikro-orm/postgresql";

import { createOrmConfig, migrationsOptions } from "../config";

/** An ORM connected to `url` with all migrations applied. Close it with `orm.close(true)`. */
export async function createMigratedOrm(url: string): Promise<MikroORM> {
  const orm = new MikroORM({
    ...createOrmConfig({ clientUrl: url, poolMax: 2 }),
    // Migration paths are relative to the db package, not to the caller's cwd.
    baseDir: fileURLToPath(new URL("../..", import.meta.url)),
    extensions: [Migrator],
    migrations: migrationsOptions,
  });
  await orm.migrator.up();
  return orm;
}
