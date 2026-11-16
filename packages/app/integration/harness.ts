import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

import { createMigratedOrm, startTestDatabase } from "@devmentor/db/testing";

import { migrateAuthSchema } from "../src/server/auth/migrate";
import { createAuthOptions } from "../src/server/auth/options";

const APP_DIR = fileURLToPath(new URL("..", import.meta.url));

export type EphemeralApp = {
  url: string;
  databaseUrl: string;
  stop(): Promise<void>;
};

export type EphemeralAppOptions = {
  /** Run `next build` first. Skip only when `.next` already holds a build of the current code. */
  build: boolean;
  port?: number;
  /** Where server output goes; defaults to discarding it. */
  log?: (line: string) => void;
};

/**
 * A disposable DevMentor instance: fresh PostgreSQL (Testcontainers or INTEGRATION_DATABASE_URL),
 * MikroORM and Better Auth migrations, then `next start` on its own port.
 */
export async function startEphemeralApp(options: EphemeralAppOptions): Promise<EphemeralApp> {
  const database = await startTestDatabase();
  let server: ChildProcess | undefined;
  try {
    await migrate(database.url);
    const env = {
      ...process.env,
      NODE_ENV: "production" as const,
      DATABASE_URL: database.url,
      BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
    };
    if (options.build) {
      await run("npm", ["run", "build"], env, options.log);
    }
    const port = options.port ?? (await freePort());
    const url = `http://localhost:${port}`;
    server = spawn("npx", ["next", "start", "--port", String(port)], {
      cwd: APP_DIR,
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    forward(server, options.log);
    await waitForHealthy(url, server);
    const started = server;
    return {
      url,
      databaseUrl: database.url,
      stop: async () => {
        await stopProcess(started);
        await database.stop();
      },
    };
  } catch (error) {
    if (server) await stopProcess(server);
    await database.stop();
    throw error;
  }
}

async function migrate(databaseUrl: string): Promise<void> {
  const orm = await createMigratedOrm(databaseUrl);
  await orm.close(true);
  const authOptions = createAuthOptions({
    databaseUrl,
    poolMax: 1,
    secret: randomBytes(32).toString("base64"),
    baseURL: undefined,
    allowedHosts: [],
    trustedOrigins: [],
  });
  await migrateAuthSchema(authOptions);
  await authOptions.database.end();
}

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  log: EphemeralAppOptions["log"],
): Promise<void> {
  const child = spawn(command, args, { cwd: APP_DIR, env, stdio: ["ignore", "pipe", "pipe"] });
  const output: string[] = [];
  forward(child, (line) => {
    output.push(line);
    log?.(line);
  });
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${command} ${args.join(" ")} failed (${code}):\n${output.slice(-40).join("\n")}`,
          ),
        );
    });
  });
}

function forward(child: ChildProcess, log: EphemeralAppOptions["log"]): void {
  for (const stream of [child.stdout, child.stderr]) {
    stream?.setEncoding("utf8");
    stream?.on("data", (chunk: string) => {
      for (const line of chunk.split("\n")) if (line.trim()) log?.(line);
    });
  }
}

async function freePort(): Promise<number> {
  const probe = createServer().listen(0);
  await once(probe, "listening");
  const address = probe.address();
  probe.close();
  if (address === null || typeof address === "string") throw new Error("Could not pick a port.");
  return address.port;
}

async function waitForHealthy(url: string, server: ChildProcess): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error(`next start exited with code ${server.exitCode}.`);
    const healthy = await fetch(`${url}/api/health`).then(
      (response) => response.ok,
      () => false,
    );
    if (healthy) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${url} did not become healthy within 120 s.`);
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.pid === undefined) return;
  const exited = once(child, "exit");
  // npx starts next as a grandchild; signal the whole process group.
  process.kill(-child.pid, "SIGTERM");
  await exited;
}
