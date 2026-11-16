import { cleanup, render, screen } from "@testing-library/react";
import { isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  findAsyncElement,
  renderAsyncElement,
  withAsyncPlaceholders,
} from "@/testing/server-components";

const actor = { userId: "u-1", role: "user" as const, name: "Alice" };
const profile = {
  id: "p-1",
  userId: "u-1",
  displayName: "Alice",
  bio: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const getOwnProfile = vi.fn(() => Promise.resolve(profile));
const requireActor = vi.fn(() => Promise.resolve(actor));

vi.mock("@/server/auth/session", () => ({ requireActor }));
vi.mock("@/server/container", () => ({
  getRequestScope: () => ({ resolve: () => ({ getOwnProfile }) }),
}));
vi.mock("../_components/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));
vi.mock("./profile-form", () => ({ ProfileForm: () => <form aria-label="profile form" /> }));

const { default: AccountPage, metadata } = await import("./page");
const { ProfileForm } = await import("./profile-form");

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("AccountPage", () => {
  it("renders the account shell with the profile streamed inside Suspense", () => {
    render(withAsyncPlaceholders(AccountPage()));

    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Profile" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined();
    expect(screen.getByTestId("async:AccountProfile")).toBeDefined();
    expect(metadata.title).toBe("Account · DevMentor");
  });

  it("loads the signed-in actor's own profile into the form", async () => {
    const output = await renderAsyncElement(findAsyncElement(AccountPage(), "AccountProfile"));

    expect(requireActor).toHaveBeenCalledOnce();
    expect(getOwnProfile).toHaveBeenCalledWith(actor);
    expect(isValidElement(output) && output.type).toBe(ProfileForm);
    expect(isValidElement<{ profile: unknown }>(output) && output.props.profile).toEqual(profile);
  });

  it("does not load a profile when there is no session (requireActor redirects)", async () => {
    requireActor.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(
      renderAsyncElement(findAsyncElement(AccountPage(), "AccountProfile")),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(getOwnProfile).not.toHaveBeenCalled();
  });
});
