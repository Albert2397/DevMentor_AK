// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "./security-headers";

const csp = (nodeEnv: string) =>
  buildSecurityHeaders(nodeEnv).find((header) => header.key === "Content-Security-Policy")?.value;

describe("buildSecurityHeaders", () => {
  it("sets the baseline headers", () => {
    expect(buildSecurityHeaders("development")).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ]),
    );
  });

  it("blocks framing in production", () => {
    expect(csp("production")).toBe(
      "base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'",
    );
  });

  it("allows framing outside production so the sandbox preview can embed the dev server", () => {
    expect(csp("development")).toBe("base-uri 'self'; form-action 'self'; object-src 'none'");
  });
});
