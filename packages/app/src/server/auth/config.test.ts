// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgres://db",
    DATABASE_POOL_MAX: 5,
    BETTER_AUTH_SECRET: "secret",
    BETTER_AUTH_URL: "https://devmentor.example",
    BETTER_AUTH_ALLOWED_HOSTS: ["a.example"],
    BETTER_AUTH_TRUSTED_ORIGINS: ["https://trusted.example"],
  },
}));

import { authConfigFromEnv } from "./config";

describe("authConfigFromEnv", () => {
  it("maps validated env to the auth configuration", () => {
    expect(authConfigFromEnv()).toEqual({
      databaseUrl: "postgres://db",
      poolMax: 5,
      secret: "secret",
      baseURL: "https://devmentor.example",
      allowedHosts: ["a.example"],
      trustedOrigins: ["https://trusted.example"],
    });
  });
});
