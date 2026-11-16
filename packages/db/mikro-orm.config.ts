import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";

import { entities, migrationsOptions } from "./src/config";

// CLI only (migrations); the app builds its config via registerDb() from validated env.
export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities,
  extensions: [Migrator],
  migrations: migrationsOptions,
});
