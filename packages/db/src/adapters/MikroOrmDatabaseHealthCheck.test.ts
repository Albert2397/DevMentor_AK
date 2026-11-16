import { describe, expect, it } from "vitest";

import { fakeEntityManager } from "../testing/fakeEntityManager";
import { MikroOrmDatabaseHealthCheck } from "./MikroOrmDatabaseHealthCheck";

describe("MikroOrmDatabaseHealthCheck", () => {
  it("pings with a trivial query", async () => {
    const { execute, em } = fakeEntityManager();

    await expect(new MikroOrmDatabaseHealthCheck({ em }).ping()).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledWith("select 1");
  });

  it("propagates connection failures", async () => {
    const { execute, em } = fakeEntityManager();
    execute.mockRejectedValueOnce(new Error("connection refused"));

    await expect(new MikroOrmDatabaseHealthCheck({ em }).ping()).rejects.toThrow(
      "connection refused",
    );
  });
});
