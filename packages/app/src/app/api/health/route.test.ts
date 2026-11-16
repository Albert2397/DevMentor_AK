// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(() => Promise.resolve()),
  check: vi.fn(),
}));

vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("@/server/container", () => ({
  getRequestScope: () => ({ resolve: () => ({ check: mocks.check }) }),
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  it("answers 200 when the database is up", async () => {
    mocks.check.mockResolvedValue({ status: "ok", database: "up" });

    const response = await GET();

    expect(mocks.connection).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok", database: "up" });
  });

  it("answers 503 when the app is degraded", async () => {
    mocks.check.mockResolvedValue({ status: "degraded", database: "down" });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "degraded", database: "down" });
  });
});
