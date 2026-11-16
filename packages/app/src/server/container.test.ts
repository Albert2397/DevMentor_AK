// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { registerDb } = vi.hoisted(() => ({ registerDb: vi.fn() }));

vi.mock("@devmentor/db", () => ({ registerDb }));

async function loadContainer(logLevel: string) {
  vi.resetModules();
  vi.doMock("@/env", () => ({
    env: { DATABASE_URL: "postgres://db", DATABASE_POOL_MAX: 7, LOG_LEVEL: logLevel },
  }));
  return import("./container");
}

describe("container", () => {
  afterEach(() => {
    registerDb.mockClear();
  });

  it("builds the container once and registers core services", async () => {
    const { getContainer } = await loadContainer("info");

    const container = getContainer();

    expect(getContainer()).toBe(container);
    expect(container.resolve("appInfo").getMetadata()).toEqual({
      title: "DevMentor",
      description: "Your Next.js app will show up here.",
    });
    expect(registerDb).toHaveBeenCalledTimes(1);
  });

  it("passes the database configuration from env to registerDb", async () => {
    const { getContainer } = await loadContainer("info");

    const container = getContainer();

    expect(registerDb).toHaveBeenCalledWith(container, {
      clientUrl: "postgres://db",
      poolMax: 7,
      debug: false,
    });
  });

  it.each(["debug", "trace"])("enables ORM debug logging for LOG_LEVEL=%s", async (level) => {
    const { getContainer } = await loadContainer(level);

    getContainer();

    expect(registerDb).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ debug: true }),
    );
  });

  it("hands out request scopes of the shared container", async () => {
    const { getContainer, getRequestScope } = await loadContainer("info");

    const scope = getRequestScope();

    expect(scope).not.toBe(getContainer());
    expect(scope.resolve("appInfo")).toBe(getContainer().resolve("appInfo"));
  });
});
