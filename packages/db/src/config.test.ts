import { describe, expect, it } from "vitest";

import { createOrmConfig, entities, migrationsOptions } from "./config";
import { UserProfileSchema } from "./entities/UserProfile";

describe("createOrmConfig", () => {
  it("connects to the given URL with a pool that releases idle connections", () => {
    const config = createOrmConfig({ clientUrl: "postgres://db/devmentor", poolMax: 7 });

    expect(config.clientUrl).toBe("postgres://db/devmentor");
    expect(config.pool).toEqual({ min: 0, max: 7, idleTimeoutMillis: 30_000 });
    expect(config.entities).toBe(entities);
    expect(config.debug).toBe(false);
  });

  it("enables query debugging on request", () => {
    expect(createOrmConfig({ clientUrl: "postgres://db/x", poolMax: 1, debug: true }).debug).toBe(
      true,
    );
  });
});

describe("entities and migrations", () => {
  it("registers the user profile schema", () => {
    expect(entities).toEqual([UserProfileSchema]);
  });

  it("keeps migrations and a database-independent snapshot in src/migrations", () => {
    expect(migrationsOptions).toMatchObject({
      path: "./src/migrations",
      pathTs: "./src/migrations",
      snapshot: true,
      snapshotName: ".snapshot-devmentor",
    });
  });
});
