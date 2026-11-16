import type { TestProject } from "vitest/node";

import { startEphemeralApp } from "./harness";

declare module "vitest" {
  export interface ProvidedContext {
    appUrl: string;
    databaseUrl: string;
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const app = await startEphemeralApp({ build: process.env.INTEGRATION_SKIP_BUILD !== "1" });
  project.provide("appUrl", app.url);
  project.provide("databaseUrl", app.databaseUrl);
  return () => app.stop();
}
