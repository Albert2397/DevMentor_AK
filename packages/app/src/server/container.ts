import "server-only";

import { cache } from "react";
import {
  APP_NAME,
  createDiContainer,
  registerCore,
  type AwilixContainer,
  type CoreCradle,
} from "@devmentor/core";
import { registerDb, type DbCradle } from "@devmentor/db";

import { env } from "@/env";

export type AppCradle = CoreCradle & DbCradle;

function buildContainer(): AwilixContainer<AppCradle> {
  const container = createDiContainer<AppCradle>();
  registerCore(container, {
    name: APP_NAME,
    description: "Your Next.js app will show up here.",
  });
  registerDb(container, {
    clientUrl: env.DATABASE_URL,
    poolMax: env.DATABASE_POOL_MAX,
    debug: env.LOG_LEVEL === "debug" || env.LOG_LEVEL === "trace",
  });
  return container;
}

let container: AwilixContainer<AppCradle> | undefined;

export function getContainer(): AwilixContainer<AppCradle> {
  container ??= buildContainer();
  return container;
}

// React's cache() is per request on the server, so every resolve within one request shares a scope.
export const getRequestScope = cache(() => getContainer().createScope());
