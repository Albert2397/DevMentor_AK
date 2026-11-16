// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/devmentor",
  BETTER_AUTH_SECRET: "x".repeat(32),
};

async function loadEnv(overrides: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...VALID, ...overrides })) vi.stubEnv(key, value);
  vi.resetModules();
  const { env } = await import("./env");
  return env;
}

describe("env", () => {
  beforeEach(() => {
    for (const key of [
      "NODE_ENV",
      "DATABASE_POOL_MAX",
      "LOG_LEVEL",
      "BETTER_AUTH_URL",
      "BETTER_AUTH_ALLOWED_HOSTS",
      "BETTER_AUTH_TRUSTED_ORIGINS",
      "SKIP_ENV_VALIDATION",
    ]) {
      vi.stubEnv(key, "");
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("applies defaults when optional variables are unset", async () => {
    const env = await loadEnv();

    expect(env.NODE_ENV).toBe("development");
    expect(env.DATABASE_URL).toBe(VALID.DATABASE_URL);
    expect(env.DATABASE_POOL_MAX).toBe(10);
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.BETTER_AUTH_URL).toBeUndefined();
    expect(env.BETTER_AUTH_ALLOWED_HOSTS).toEqual([]);
    expect(env.BETTER_AUTH_TRUSTED_ORIGINS).toEqual([]);
  });

  it("parses explicit values and splits comma-separated lists", async () => {
    const env = await loadEnv({
      NODE_ENV: "production",
      DATABASE_POOL_MAX: "4",
      LOG_LEVEL: "debug",
      BETTER_AUTH_URL: "https://devmentor.example",
      BETTER_AUTH_ALLOWED_HOSTS: " a.example , ,*.preview.example ",
      BETTER_AUTH_TRUSTED_ORIGINS: "https://one.example,https://two.example",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.DATABASE_POOL_MAX).toBe(4);
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.BETTER_AUTH_URL).toBe("https://devmentor.example");
    expect(env.BETTER_AUTH_ALLOWED_HOSTS).toEqual(["a.example", "*.preview.example"]);
    expect(env.BETTER_AUTH_TRUSTED_ORIGINS).toEqual(["https://one.example", "https://two.example"]);
  });

  it("rejects an invalid configuration", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(loadEnv({ DATABASE_URL: "not a url" })).rejects.toThrow(
      "Invalid environment variables",
    );
  });

  it("skips validation when SKIP_ENV_VALIDATION=1", async () => {
    const env = await loadEnv({ DATABASE_URL: "not a url", SKIP_ENV_VALIDATION: "1" });

    expect(env.DATABASE_URL).toBe("not a url");
  });
});
