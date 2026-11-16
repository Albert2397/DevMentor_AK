import { createDiContainer } from "@devmentor/core";
import { afterAll, describe, expect, it } from "vitest";

import { MikroOrmDatabaseHealthCheck } from "./adapters/MikroOrmDatabaseHealthCheck";
import { MikroOrmUnitOfWork } from "./adapters/MikroOrmUnitOfWork";
import { MikroOrmUserProfileRepository } from "./adapters/MikroOrmUserProfileRepository";
import { registerDb, type DbCradle } from "./index";

const container = createDiContainer<DbCradle>();
registerDb(container, { clientUrl: "postgres://nobody:nope@127.0.0.1:1/none", poolMax: 1 });

describe("registerDb", () => {
  afterAll(async () => {
    await container.resolve("orm").close(true);
  });

  it("shares one ORM across scopes", () => {
    expect(container.createScope().resolve("orm")).toBe(container.createScope().resolve("orm"));
  });

  it("forks one entity manager per request scope", () => {
    const first = container.createScope();
    const second = container.createScope();
    const rootEm = container.resolve("orm").em;

    expect(first.resolve("em")).toBe(first.resolve("em"));
    expect(first.resolve("em")).not.toBe(second.resolve("em"));
    expect(first.resolve("em")).not.toBe(rootEm);
  });

  it("provides the core ports, bound to the scope's entity manager", () => {
    const scope = container.createScope();

    expect(scope.resolve("userProfileRepository")).toBeInstanceOf(MikroOrmUserProfileRepository);
    expect(scope.resolve("unitOfWork")).toBeInstanceOf(MikroOrmUnitOfWork);
    expect(scope.resolve("databaseHealthCheck")).toBeInstanceOf(MikroOrmDatabaseHealthCheck);
    expect(scope.resolve("userProfileRepository")).toBe(scope.resolve("userProfileRepository"));
  });
});
