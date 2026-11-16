import type { EntityManager } from "@mikro-orm/postgresql";
import { vi } from "vitest";

/** Records delegation from adapters; persistence behavior is covered by *.int.test.ts. */
export function fakeEntityManager() {
  const execute = vi.fn(() => Promise.resolve([]));
  const fake = {
    findOne: vi.fn(() => Promise.resolve(null)),
    find: vi.fn(() => Promise.resolve([])),
    create: vi.fn((_entity: unknown, data: object) => ({ ...data })),
    flush: vi.fn(() => Promise.resolve()),
    getConnection: vi.fn(() => ({ execute })),
  };
  return { fake, execute, em: fake as unknown as EntityManager };
}
