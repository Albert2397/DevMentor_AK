import { describe, expect, it } from "vitest";

import { HealthService } from "./HealthService";

describe("HealthService", () => {
  it("reports ok when the database answers", async () => {
    const service = new HealthService({ databaseHealthCheck: { ping: () => Promise.resolve() } });

    await expect(service.check()).resolves.toEqual({ status: "ok", database: "up" });
  });

  it("reports degraded instead of throwing when the database is down", async () => {
    const service = new HealthService({
      databaseHealthCheck: { ping: () => Promise.reject(new Error("connection refused")) },
    });

    await expect(service.check()).resolves.toEqual({ status: "degraded", database: "down" });
  });
});
