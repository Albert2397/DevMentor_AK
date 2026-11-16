import type { TestProject } from "vitest/node";

import { startTestDatabase } from "./postgres";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const database = await startTestDatabase();
  project.provide("databaseUrl", database.url);
  return () => database.stop();
}
