import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";

import { AgentBrowser } from "./agent-browser";

const appUrl = () => inject("appUrl");

describe("public pages", () => {
  let browser: AgentBrowser;

  beforeEach(() => {
    browser = new AgentBrowser(appUrl());
  });

  afterEach(async () => {
    await browser.close();
  });

  it("renders the starter screen without accessibility violations", async () => {
    await browser.open("/");

    expect(await browser.title()).toBe("DevMentor");
    expect(await browser.headingText(1)).toBe("Your Next.js app is ready.");
    expect(await browser.a11yViolations()).toEqual([]);
  });

  it("shows the global 404 page for unknown routes", async () => {
    await browser.open("/does-not-exist");

    expect(await browser.headingText(1)).toBe("Page not found.");
  });
});

describe("HTTP contract", () => {
  it("reports the database as up on /api/health", async () => {
    const response = await fetch(`${appUrl()}/api/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "up" });
  });

  it("answers unknown routes with 404", async () => {
    expect((await fetch(`${appUrl()}/does-not-exist`)).status).toBe(404);
  });

  it("sends security headers, including the production-only framing ban", async () => {
    const response = await fetch(appUrl());

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });
});
