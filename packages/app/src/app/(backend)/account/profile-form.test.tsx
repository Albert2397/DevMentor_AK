import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdateProfileResult } from "./actions";

const updateProfile = vi.fn<(input: unknown) => Promise<UpdateProfileResult>>();

vi.mock("./actions", () => ({ updateProfile }));

const { ProfileForm } = await import("./profile-form");

const profile = {
  id: "p-1",
  userId: "u-1",
  displayName: "Alice",
  bio: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function displayName() {
  return screen.getByLabelText<HTMLInputElement>("Display name");
}

function bio() {
  return screen.getByLabelText<HTMLTextAreaElement>("Bio");
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("ProfileForm", () => {
  it("prefills the form and shows an empty bio for a profile without one", () => {
    render(<ProfileForm profile={profile} />);

    expect(displayName().value).toBe("Alice");
    expect(bio().value).toBe("");
  });

  it("prefills an existing bio", () => {
    render(<ProfileForm profile={{ ...profile, bio: "Mentor" }} />);

    expect(bio().value).toBe("Mentor");
  });

  it("validates on the client before calling the server action", async () => {
    render(<ProfileForm profile={profile} />);
    fireEvent.change(displayName(), { target: { value: "A" } });

    save();

    expect(await screen.findByText("Use at least 2 characters.")).toBeDefined();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it.each([
    ["clears the bio", null, ""],
    ["keeps the saved bio", "Reviews PRs", "Reviews PRs"],
  ])("saves, confirms and %s from the server response", async (_case, savedBio, shownBio) => {
    let finish: (result: UpdateProfileResult) => void = () => undefined;
    updateProfile.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    render(<ProfileForm profile={profile} />);
    fireEvent.change(displayName(), { target: { value: "Ada" } });
    fireEvent.change(bio(), { target: { value: "Reviews PRs" } });

    save();

    expect(await screen.findByRole("button", { name: "Saving…" })).toHaveProperty("disabled", true);
    finish({ ok: true, profile: { ...profile, displayName: "Ada Mentor", bio: savedBio } });
    expect(await screen.findByText("Profile saved.")).toBeDefined();
    expect(updateProfile).toHaveBeenCalledWith({ displayName: "Ada", bio: "Reviews PRs" });
    expect(displayName().value).toBe("Ada Mentor");
    expect(bio().value).toBe(shownBio);
  });

  it("maps server-side field errors onto the fields", async () => {
    updateProfile.mockResolvedValueOnce({
      ok: false,
      fieldErrors: { bio: ["Use at most 500 characters."] },
    });
    render(<ProfileForm profile={profile} />);

    save();

    expect(await screen.findByText("Use at most 500 characters.")).toBeDefined();
    expect(bio().getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a form-level error", async () => {
    updateProfile.mockResolvedValueOnce({
      ok: false,
      formError: "Your session has expired. Sign in again.",
    });
    render(<ProfileForm profile={profile} />);

    save();

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Your session has expired. Sign in again.",
      ),
    );
  });
});
