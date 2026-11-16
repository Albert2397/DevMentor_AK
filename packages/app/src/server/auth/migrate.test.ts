// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMigrations, runMigrations } = vi.hoisted(() => ({
  getMigrations: vi.fn(),
  runMigrations: vi.fn(() => Promise.resolve()),
}));

vi.mock("better-auth/db/migration", () => ({ getMigrations }));

import { migrateAuthSchema } from "./migrate";
import type { createAuthOptions } from "./options";

const options = { secret: "s" } as unknown as ReturnType<typeof createAuthOptions>;

function plan(created: string[], added: string[]) {
  getMigrations.mockResolvedValue({
    toBeCreated: created.map((table) => ({ table })),
    toBeAdded: added.map((table) => ({ table })),
    runMigrations,
  });
}

describe("migrateAuthSchema", () => {
  beforeEach(() => {
    runMigrations.mockClear();
  });

  it("does nothing when the schema is current", async () => {
    plan([], []);

    await expect(migrateAuthSchema(options)).resolves.toEqual({
      createdTables: [],
      alteredTables: [],
    });
    expect(getMigrations).toHaveBeenCalledWith(options);
    expect(runMigrations).not.toHaveBeenCalled();
  });

  it("creates missing tables", async () => {
    plan(["user", "session"], []);

    await expect(migrateAuthSchema(options)).resolves.toEqual({
      createdTables: ["user", "session"],
      alteredTables: [],
    });
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it("adds missing columns", async () => {
    plan([], ["user"]);

    await expect(migrateAuthSchema(options)).resolves.toEqual({
      createdTables: [],
      alteredTables: ["user"],
    });
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });
});
