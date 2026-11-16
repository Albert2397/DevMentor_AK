import type { DatabaseHealthCheck } from "@devmentor/core";
import type { EntityManager } from "@mikro-orm/postgresql";

export class MikroOrmDatabaseHealthCheck implements DatabaseHealthCheck {
  private readonly em: EntityManager;

  constructor({ em }: { em: EntityManager }) {
    this.em = em;
  }

  async ping(): Promise<void> {
    await this.em.getConnection().execute("select 1");
  }
}
