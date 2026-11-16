import { asClass, asFunction, type AwilixContainer, type CorePorts } from "@devmentor/core";
import type { EntityManager, MikroORM } from "@mikro-orm/postgresql";

import { MikroOrmDatabaseHealthCheck } from "./adapters/MikroOrmDatabaseHealthCheck";
import { MikroOrmUnitOfWork } from "./adapters/MikroOrmUnitOfWork";
import { MikroOrmUserProfileRepository } from "./adapters/MikroOrmUserProfileRepository";
import type { DbConfig } from "./config";
import { getOrm } from "./orm";

export type DbCradle = CorePorts & {
  orm: MikroORM;
  em: EntityManager;
};

export function registerDb<Cradle extends DbCradle>(
  container: AwilixContainer<Cradle>,
  config: DbConfig,
): void {
  container.register("orm", asFunction(() => getOrm(config)).singleton());
  container.register("em", asFunction(({ orm }: { orm: MikroORM }) => orm.em.fork()).scoped());
  container.register("userProfileRepository", asClass(MikroOrmUserProfileRepository).scoped());
  container.register("unitOfWork", asClass(MikroOrmUnitOfWork).scoped());
  container.register("databaseHealthCheck", asClass(MikroOrmDatabaseHealthCheck).scoped());
}
