import { getMigrations } from "better-auth/db/migration";

import type { createAuthOptions } from "./options";

export type AuthMigrationResult = {
  createdTables: string[];
  alteredTables: string[];
};

/** Creates or extends the Better Auth tables; a no-op when the schema is current. */
export async function migrateAuthSchema(
  options: ReturnType<typeof createAuthOptions>,
): Promise<AuthMigrationResult> {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(options);
  const result = {
    createdTables: toBeCreated.map((change) => change.table),
    alteredTables: toBeAdded.map((change) => change.table),
  };
  if (result.createdTables.length > 0 || result.alteredTables.length > 0) {
    await runMigrations();
  }
  return result;
}
