import { startEphemeralApp } from "../integration/harness";

const build = !process.argv.includes("--no-build");
const port = process.env.PORT ? Number(process.env.PORT) : undefined;

console.info(`Starting an ephemeral DevMentor (${build ? "with" : "without"} build)…`);
const app = await startEphemeralApp({
  build,
  port,
  log: process.argv.includes("--verbose") ? console.info : undefined,
});
console.info(`
Ephemeral DevMentor is running on a fresh database.
  URL:      ${app.url}
  Database: ${app.databaseUrl}

Test it with agent-browser, e.g.:
  npx agent-browser --session manual open ${app.url}
  npx agent-browser --session manual snapshot -i

Press Ctrl+C to stop the app and remove the database.`);

const shutdown = async () => {
  await app.stop();
  process.exit(0);
};
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
