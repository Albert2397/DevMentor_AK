import { MikroORM } from "@mikro-orm/postgresql";

import { createOrmConfig, type DbConfig } from "./config";

// One ORM per module instance, deliberately not on globalThis: Next evaluates this package once per
// bundle layer (route handlers vs. page rendering), each with its own entity classes, and an ORM only
// knows the classes it discovered. The pool (min 0, idle timeout) releases connections it does not use.
let orm: MikroORM | undefined;

export function getOrm(config: DbConfig): MikroORM {
  orm ??= new MikroORM(createOrmConfig(config));
  return orm;
}
