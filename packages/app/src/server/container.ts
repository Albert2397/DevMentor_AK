import "server-only";

import { cache } from "react";
import { APP_NAME, createDiContainer, registerCore, type AwilixContainer, type CoreCradle } from "@devmentor/core";

export type AppCradle = CoreCradle;

function buildContainer(): AwilixContainer<AppCradle> {
  const container = createDiContainer<AppCradle>();
  registerCore(container, {
    name: APP_NAME,
    description: "Your Next.js app will show up here.",
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
