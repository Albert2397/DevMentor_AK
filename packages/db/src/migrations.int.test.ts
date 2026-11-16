import type { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import { createMigratedOrm } from "./testing/database";

let orm: MikroORM;

beforeAll(async () => {
  orm = await createMigratedOrm(inject("databaseUrl"));
});

afterAll(async () => {
  await orm.close(true);
});

describe("migrations", () => {
  it("produce exactly the schema the entities describe", async () => {
    // Non-empty SQL means an entity changed without a migration (npm run db:migration:create).
    // Better Auth's tables live in the same database but are not created here, so nothing is dropped.
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe("");
  });
});
