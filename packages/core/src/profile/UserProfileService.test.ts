import { beforeEach, describe, expect, it } from "vitest";

import type { Actor } from "../auth/Actor";
import { ForbiddenError } from "../errors/DomainError";
import type { UnitOfWork } from "../persistence/UnitOfWork";
import type { NewUserProfile, UserProfile } from "./UserProfile";
import type { UserProfileRepository } from "./UserProfileRepository";
import { UserProfileService } from "./UserProfileService";
import { updateProfileSchema } from "./schemas";

class InMemoryProfiles implements UserProfileRepository, UnitOfWork {
  readonly stored: UserProfile[] = [];
  private pending: UserProfile[] = [];
  commits = 0;

  findByUserId(userId: string): Promise<UserProfile | null> {
    return Promise.resolve(this.stored.find((p) => p.userId === userId) ?? null);
  }

  add(data: NewUserProfile): UserProfile {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const profile: UserProfile = {
      id: `p-${data.userId}`,
      bio: null,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    this.pending.push(profile);
    return profile;
  }

  listRecent(limit: number): Promise<UserProfile[]> {
    return Promise.resolve(this.stored.slice(0, limit));
  }

  commit(): Promise<void> {
    this.stored.push(...this.pending);
    this.pending = [];
    this.commits += 1;
    return Promise.resolve();
  }
}

const alice: Actor = { userId: "u-alice", role: "user", name: "Alice" };
const admin: Actor = { userId: "u-admin", role: "admin", name: "Admin" };

describe("UserProfileService", () => {
  let profiles: InMemoryProfiles;
  let service: UserProfileService;

  beforeEach(() => {
    profiles = new InMemoryProfiles();
    service = new UserProfileService({ userProfileRepository: profiles, unitOfWork: profiles });
  });

  it("creates the actor's profile on first read, named after the actor", async () => {
    const profile = await service.getOwnProfile(alice);

    expect(profile).toMatchObject({ userId: "u-alice", displayName: "Alice", bio: null });
    expect(profiles.stored).toHaveLength(1);
  });

  it("returns the existing profile instead of creating a second one", async () => {
    await service.getOwnProfile(alice);
    await service.getOwnProfile(alice);

    expect(profiles.stored).toHaveLength(1);
  });

  it("updates only the actor's own profile and commits once", async () => {
    await service.getOwnProfile(admin);
    profiles.commits = 0;

    const updated = await service.updateOwnProfile(
      alice,
      updateProfileSchema.parse({ displayName: "  Alice Smith ", bio: "" }),
    );

    expect(updated).toMatchObject({ userId: "u-alice", displayName: "Alice Smith", bio: null });
    expect(profiles.stored.find((p) => p.userId === "u-admin")?.displayName).toBe("Admin");
    expect(profiles.commits).toBe(1);
  });

  it("keeps a non-empty bio as entered", async () => {
    const updated = await service.updateOwnProfile(alice, { displayName: "Alice", bio: "Mentor" });

    expect(updated.bio).toBe("Mentor");
  });

  it("lets admins list profiles", async () => {
    await service.getOwnProfile(alice);

    await expect(service.listProfiles(admin)).resolves.toHaveLength(1);
  });

  it("forbids regular users from listing profiles", async () => {
    await expect(service.listProfiles(alice)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("updateProfileSchema", () => {
  it("rejects a display name shorter than 2 characters after trimming", () => {
    expect(updateProfileSchema.safeParse({ displayName: " a ", bio: "" }).success).toBe(false);
  });

  it("rejects a bio longer than 500 characters", () => {
    expect(
      updateProfileSchema.safeParse({ displayName: "Alice", bio: "x".repeat(501) }).success,
    ).toBe(false);
  });
});
