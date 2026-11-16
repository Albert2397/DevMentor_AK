import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";

import { AgentBrowser } from "./agent-browser";
import { makeAdmin, signUp, uniqueUser } from "./support";

describe("authentication and authorization", () => {
  let browser: AgentBrowser;

  beforeEach(() => {
    browser = new AgentBrowser(inject("appUrl"));
  });

  afterEach(async () => {
    await browser.close();
  });

  it("redirects guests from protected pages to sign-in", async () => {
    await browser.open("/account");
    expect(await browser.path()).toBe("/sign-in");

    await browser.open("/backend");
    expect(await browser.path()).toBe("/sign-in");
  });

  it("validates the sign-up form before submitting", async () => {
    await browser.open("/sign-up");
    await browser.fill("Email", "not-an-email");
    await browser.fill("Password", "short");
    await browser.clickButton("Create account");

    await browser.waitForText("Use at least 2 characters.");
    await browser.waitForText("Enter a valid email address.");
    await browser.waitForText("Use at least 8 characters.");
    expect(await browser.path()).toBe("/sign-up");
  });

  it("lets a new member sign up, edit the profile, sign out and sign back in", async () => {
    const user = uniqueUser("member");
    await signUp(browser, user);

    expect(await browser.valueOf("Display name")).toBe(user.name);
    expect(await browser.a11yViolations()).toEqual([]);

    await browser.fill("Display name", "Ada Mentor");
    await browser.fill("Bio", "I review pull requests for juniors.");
    await browser.clickButton("Save profile");
    await browser.waitForText("Profile saved.");

    await browser.open("/account");
    await browser.waitForText("Display name");
    expect(await browser.valueOf("Display name")).toBe("Ada Mentor");
    expect(await browser.valueOf("Bio")).toBe("I review pull requests for juniors.");

    await browser.clickButton("Sign out");
    await browser.waitForPath("/sign-in");

    await browser.fill("Email", user.email);
    await browser.fill("Password", "wrong-password");
    await browser.clickButton("Sign in");
    await browser.waitForText("Invalid email or password");

    await browser.fill("Password", user.password);
    await browser.clickButton("Sign in");
    await browser.waitForPath("/account");
    await browser.waitForText("Display name");
    expect(await browser.valueOf("Display name")).toBe("Ada Mentor");
  });

  it("denies the panel to regular members and opens it to admins", async () => {
    const member = uniqueUser("panel");
    await signUp(browser, member);

    await browser.open("/backend");
    await browser.waitForText("Access denied");

    await makeAdmin(member.email);
    await browser.open("/backend");
    await browser.waitForText("Profiles");
    await browser.waitForText(member.name);
    await browser.waitForText("Database connected");
  });
});
