import type { Pool } from "pg";

/** Grants the admin role; returns false when no user has this email. */
export async function promoteToAdmin(pool: Pick<Pool, "query">, email: string): Promise<boolean> {
  const result = await pool.query('update "user" set role = $1 where email = $2', ["admin", email]);
  return (result.rowCount ?? 0) > 0;
}
