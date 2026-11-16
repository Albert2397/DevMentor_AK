import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, describe, expect, it } from "vitest";

import { UserProfileEntity } from "./entities/UserProfile";
import { getOrm } from "./orm";

// An unreachable server: MikroORM 7 connects lazily, so nothing here may touch it.
const config = { clientUrl: "postgres://nobody:nope@127.0.0.1:1/none", poolMax: 3 };

describe("getOrm", () => {
  const orm = getOrm(config);

  afterAll(async () => {
    await orm.close(true);
  });

  it("builds the ORM from createOrmConfig without connecting", async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.config.get("pool")).toMatchObject({ max: 3 });
    expect(orm.getMetadata().find(UserProfileEntity)).toBeDefined();
    await expect(orm.isConnected()).resolves.toBe(false);
  });

  it("returns the same instance for this module on every call", () => {
    expect(getOrm({ ...config, poolMax: 9 })).toBe(orm);
  });
});
