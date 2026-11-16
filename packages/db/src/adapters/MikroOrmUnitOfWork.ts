import type { UnitOfWork } from "@devmentor/core";
import type { EntityManager } from "@mikro-orm/postgresql";

export class MikroOrmUnitOfWork implements UnitOfWork {
  private readonly em: EntityManager;

  constructor({ em }: { em: EntityManager }) {
    this.em = em;
  }

  commit(): Promise<void> {
    return this.em.flush();
  }
}
