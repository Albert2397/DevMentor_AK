import { UniqueConstraintViolationException, type MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import { createMigratedOrm } from "../testing/database";
import { MikroOrmDatabaseHealthCheck } from "./MikroOrmDatabaseHealthCheck";
import { MikroOrmUnitOfWork } from "./MikroOrmUnitOfWork";
import { MikroOrmUserProfileRepository } from "./MikroOrmUserProfileRepository";

let orm: MikroORM;

beforeAll(async () => {
  orm = await createMigratedOrm(inject("databaseUrl"));
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clear();
});

function requestScope() {
  const em = orm.em.fork();
  return {
    repository: new MikroOrmUserProfileRepository({ em }),
    unitOfWork: new MikroOrmUnitOfWork({ em }),
  };
}

describe("MikroOrmUserProfileRepository", () => {
  it("persists an added profile only after commit", async () => {
    const writer = requestScope();
    const added = writer.repository.add({ userId: "u-1", displayName: "Alice" });

    await expect(requestScope().repository.findByUserId("u-1")).resolves.toBeNull();
    await writer.unitOfWork.commit();

    const found = await requestScope().repository.findByUserId("u-1");
    expect(found).toMatchObject({ id: added.id, userId: "u-1", displayName: "Alice", bio: null });
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it("generates time-ordered UUID v7 identifiers", async () => {
    const { repository, unitOfWork } = requestScope();
    const profile = repository.add({ userId: "u-1", displayName: "Alice" });
    await unitOfWork.commit();

    expect(profile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("writes changes to a loaded profile on commit", async () => {
    const seed = requestScope();
    seed.repository.add({ userId: "u-1", displayName: "Alice" });
    await seed.unitOfWork.commit();

    const editor = requestScope();
    const profile = await editor.repository.findByUserId("u-1");
    if (!profile) throw new Error("seeded profile missing");
    profile.displayName = "Alice Smith";
    profile.bio = "Mentor";
    await editor.unitOfWork.commit();

    await expect(requestScope().repository.findByUserId("u-1")).resolves.toMatchObject({
      displayName: "Alice Smith",
      bio: "Mentor",
    });
  });

  it("enforces one profile per user", async () => {
    const { repository, unitOfWork } = requestScope();
    repository.add({ userId: "u-1", displayName: "Alice" });
    await unitOfWork.commit();

    const duplicate = requestScope();
    duplicate.repository.add({ userId: "u-1", displayName: "Alice again" });

    await expect(duplicate.unitOfWork.commit()).rejects.toBeInstanceOf(
      UniqueConstraintViolationException,
    );
  });

  it("lists the most recently updated profiles first, up to the limit", async () => {
    for (const userId of ["u-1", "u-2", "u-3"]) {
      const { repository, unitOfWork } = requestScope();
      repository.add({ userId, displayName: userId });
      await unitOfWork.commit();
    }

    const recent = await requestScope().repository.listRecent(2);

    expect(recent.map((p) => p.userId)).toEqual(["u-3", "u-2"]);
  });
});

describe("MikroOrmDatabaseHealthCheck", () => {
  it("pings the database", async () => {
    await expect(
      new MikroOrmDatabaseHealthCheck({ em: orm.em.fork() }).ping(),
    ).resolves.toBeUndefined();
  });
});
