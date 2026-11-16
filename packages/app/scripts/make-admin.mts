import { Pool } from "pg";

import { env } from "../src/env";
import { promoteToAdmin } from "../src/server/auth/admin";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run auth:make-admin -- <email>");
  process.exit(1);
}

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
const promoted = await promoteToAdmin(pool, email);
await pool.end();
if (!promoted) {
  console.error(`No user with email ${email}.`);
  process.exit(1);
}
console.info(`${email} is now an admin.`);
