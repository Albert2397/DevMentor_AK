// @vitest-environment node
import { ForbiddenError, type UserProfileDto } from "@devmentor/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActor: vi.fn(),
  updateOwnProfile: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({ getActor: mocks.getActor }));
vi.mock("@/server/container", () => ({
  getRequestScope: () => ({ resolve: () => ({ updateOwnProfile: mocks.updateOwnProfile }) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { updateProfile } from "./actions";

const actor = { userId: "u-1", role: "user" as const, name: "Alice" };
const profile: UserProfileDto = {
  id: "p-1",
  userId: "u-1",
  displayName: "Alice Smith",
  bio: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActor.mockResolvedValue(actor);
  });

  it("returns field errors for invalid input without touching the session", async () => {
    const result = await updateProfile({ displayName: "a", bio: "" });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { displayName: ["Use at least 2 characters."] },
    });
    expect(mocks.getActor).not.toHaveBeenCalled();
  });

  it("asks guests to sign in again", async () => {
    mocks.getActor.mockResolvedValue(null);

    await expect(updateProfile({ displayName: "Alice", bio: "" })).resolves.toEqual({
      ok: false,
      formError: "Your session has expired. Sign in again.",
    });
    expect(mocks.updateOwnProfile).not.toHaveBeenCalled();
  });

  it("updates the actor's profile with parsed input and revalidates the page", async () => {
    mocks.updateOwnProfile.mockResolvedValue(profile);

    await expect(updateProfile({ displayName: "  Alice Smith ", bio: "" })).resolves.toEqual({
      ok: true,
      profile,
    });
    expect(mocks.updateOwnProfile).toHaveBeenCalledWith(actor, {
      displayName: "Alice Smith",
      bio: "",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("turns domain errors into a form error", async () => {
    mocks.updateOwnProfile.mockRejectedValue(new ForbiddenError("Not allowed."));

    await expect(updateProfile({ displayName: "Alice", bio: "" })).resolves.toEqual({
      ok: false,
      formError: "Not allowed.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rethrows unexpected errors", async () => {
    mocks.updateOwnProfile.mockRejectedValue(new Error("db down"));

    await expect(updateProfile({ displayName: "Alice", bio: "" })).rejects.toThrow("db down");
  });
});
