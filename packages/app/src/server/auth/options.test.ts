// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { createAuthOptions, type AuthConfig } from "./options";

const base: AuthConfig = {
  databaseUrl: "postgres://user:pass@localhost:5432/devmentor",
  poolMax: 3,
  secret: "s".repeat(32),
  baseURL: undefined,
  allowedHosts: [],
  trustedOrigins: ["https://trusted.example"],
};

const created: ReturnType<typeof createAuthOptions>[] = [];
function options(overrides: Partial<AuthConfig> = {}) {
  const result = createAuthOptions({ ...base, ...overrides });
  created.push(result);
  return result;
}

describe("createAuthOptions", () => {
  afterEach(async () => {
    await Promise.all(created.splice(0).map((o) => o.database.end()));
  });

  it("uses a pg pool for the configured database", () => {
    const { database } = options();

    expect(database.options.connectionString).toBe(base.databaseUrl);
    expect(database.options.max).toBe(3);
  });

  it("enables email and password sign-in with the admin plugin", () => {
    const result = options();

    expect(result.secret).toBe(base.secret);
    expect(result.trustedOrigins).toEqual(["https://trusted.example"]);
    expect(result.emailAndPassword).toEqual({
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    });
    expect(result.plugins.map((plugin) => plugin.id)).toEqual(["admin"]);
  });

  it("prefers an explicit base URL", () => {
    expect(
      options({ baseURL: "https://devmentor.example", allowedHosts: ["a.example"] }).baseURL,
    ).toBe("https://devmentor.example");
  });

  it("derives a dynamic base URL from allowed hosts", () => {
    expect(options({ allowedHosts: ["a.example", "*.preview.example"] }).baseURL).toEqual({
      allowedHosts: ["a.example", "*.preview.example"],
      protocol: "auto",
    });
  });

  it("leaves the base URL to the request when nothing is configured", () => {
    expect(options().baseURL).toBeUndefined();
  });
});
