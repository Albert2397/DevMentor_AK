import { authConfigFromEnv } from "../src/server/auth/config";
import { migrateAuthSchema } from "../src/server/auth/migrate";
import { createAuthOptions } from "../src/server/auth/options";

const options = createAuthOptions(authConfigFromEnv());
const { createdTables, alteredTables } = await migrateAuthSchema(options);
await options.database.end();
console.info(
  createdTables.length + alteredTables.length === 0
    ? "Auth schema is up to date."
    : `Auth schema migrated (created: ${createdTables.join(", ") || "none"}; altered: ${alteredTables.join(", ") || "none"}).`,
);
