import { randomBytes } from "node:crypto";

import { Client } from "pg";

export type TestDatabase = {
  url: string;
  stop(): Promise<void>;
};

/**
 * A throwaway PostgreSQL database: a Testcontainers container by default, or — where Docker is not
 * available (e.g. an agent sandbox) — a randomly named database on the server in
 * INTEGRATION_DATABASE_URL, dropped again by stop().
 */
export async function startTestDatabase(): Promise<TestDatabase> {
  const serverUrl = process.env.INTEGRATION_DATABASE_URL;
  return serverUrl ? createTemporaryDatabase(serverUrl) : startContainer();
}

async function startContainer(): Promise<TestDatabase> {
  const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
  const container = await new PostgreSqlContainer("postgres:17-alpine")
    .start()
    .catch((error: unknown) => {
      throw new Error(
        "Could not start PostgreSQL with Testcontainers (is Docker running?). Without Docker, set " +
          "INTEGRATION_DATABASE_URL to a PostgreSQL server where temporary databases may be created.",
        { cause: error },
      );
    });
  return {
    url: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
}

async function createTemporaryDatabase(serverUrl: string): Promise<TestDatabase> {
  const name = `devmentor_it_${randomBytes(6).toString("hex")}`;
  await withClient(serverUrl, (client) => client.query(`create database "${name}"`));
  const url = new URL(serverUrl);
  url.pathname = `/${name}`;
  return {
    url: url.toString(),
    stop: () =>
      withClient(serverUrl, (client) =>
        client.query(`drop database if exists "${name}" with (force)`),
      ),
  };
}

async function withClient(url: string, run: (client: Client) => Promise<unknown>): Promise<void> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await run(client);
  } finally {
    await client.end();
  }
}
