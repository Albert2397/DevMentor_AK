import { Pool } from "pg";
import { inject } from "vitest";

import { promoteToAdmin } from "../src/server/auth/admin";
import type { AgentBrowser } from "./agent-browser";

export function uniqueUser(prefix: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `${prefix} ${id}`,
    email: `${prefix}-${id}@example.com`,
    password: "correct-horse-battery",
  };
}

export async function signUp(browser: AgentBrowser, user: ReturnType<typeof uniqueUser>) {
  await browser.open("/sign-up");
  await browser.fill("Name", user.name);
  await browser.fill("Email", user.email);
  await browser.fill("Password", user.password);
  await browser.clickButton("Create account");
  await browser.waitForPath("/account");
}

export async function makeAdmin(email: string): Promise<void> {
  const pool = new Pool({ connectionString: inject("databaseUrl"), max: 1 });
  try {
    if (!(await promoteToAdmin(pool, email))) throw new Error(`No user ${email}.`);
  } finally {
    await pool.end();
  }
}
