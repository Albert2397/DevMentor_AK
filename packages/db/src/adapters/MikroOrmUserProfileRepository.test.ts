import { describe, expect, it } from "vitest";

import { UserProfileEntity } from "../entities/UserProfile";
import { fakeEntityManager } from "../testing/fakeEntityManager";
import { MikroOrmUserProfileRepository } from "./MikroOrmUserProfileRepository";

describe("MikroOrmUserProfileRepository", () => {
  it("looks a profile up by user id", async () => {
    const { fake, em } = fakeEntityManager();
    const found = { id: "p-1" };
    fake.findOne.mockResolvedValueOnce(found as never);

    await expect(new MikroOrmUserProfileRepository({ em }).findByUserId("u-1")).resolves.toBe(
      found,
    );
    expect(fake.findOne).toHaveBeenCalledWith(UserProfileEntity, { userId: "u-1" });
  });

  it("creates new profiles without a bio and does not flush", () => {
    const { fake, em } = fakeEntityManager();

    const profile = new MikroOrmUserProfileRepository({ em }).add({
      userId: "u-1",
      displayName: "Alice",
    });

    expect(fake.create).toHaveBeenCalledWith(UserProfileEntity, {
      userId: "u-1",
      displayName: "Alice",
      bio: null,
    });
    expect(profile).toEqual({ userId: "u-1", displayName: "Alice", bio: null });
    expect(fake.flush).not.toHaveBeenCalled();
  });

  it("lists the most recently updated profiles up to the limit", async () => {
    const { fake, em } = fakeEntityManager();

    await new MikroOrmUserProfileRepository({ em }).listRecent(5);

    expect(fake.find).toHaveBeenCalledWith(
      UserProfileEntity,
      {},
      { orderBy: { updatedAt: "desc" }, limit: 5 },
    );
  });
});
