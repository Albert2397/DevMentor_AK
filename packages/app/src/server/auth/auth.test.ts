// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: unknown) => ({ instance: options })),
  nextCookies: vi.fn(() => ({ id: "next-cookies" })),
  createAuthOptions: vi.fn(() => ({ secret: "s", plugins: [{ id: "admin" }] })),
  authConfigFromEnv: vi.fn(() => ({ databaseUrl: "postgres://db" })),
}));

vi.mock("better-auth", () => ({ betterAuth: mocks.betterAuth }));
vi.mock("better-auth/next-js", () => ({ nextCookies: mocks.nextCookies }));
vi.mock("./options", () => ({ createAuthOptions: mocks.createAuthOptions }));
vi.mock("./config", () => ({ authConfigFromEnv: mocks.authConfigFromEnv }));

import { getAuth } from "./auth";

describe("getAuth", () => {
  beforeEach(() => {
    delete (globalThis as { __devmentorAuth?: unknown }).__devmentorAuth;
    mocks.betterAuth.mockClear();
  });

  it("creates Better Auth from env-derived options with the Next cookies plugin appended", () => {
    const auth = getAuth();

    expect(mocks.createAuthOptions).toHaveBeenCalledWith({ databaseUrl: "postgres://db" });
    expect(mocks.betterAuth).toHaveBeenCalledWith({
      secret: "s",
      plugins: [{ id: "admin" }, { id: "next-cookies" }],
    });
    expect(auth).toEqual({ instance: mocks.betterAuth.mock.calls[0]?.[0] });
  });

  it("reuses one instance per process", () => {
    expect(getAuth()).toBe(getAuth());
    expect(mocks.betterAuth).toHaveBeenCalledTimes(1);
  });
});
