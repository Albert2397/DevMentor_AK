import "server-only";

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { authConfigFromEnv } from "./config";
import { createAuthOptions } from "./options";

function createAuth() {
  const options = createAuthOptions(authConfigFromEnv());
  return betterAuth({ ...options, plugins: [...options.plugins, nextCookies()] });
}

type Auth = ReturnType<typeof createAuth>;

// One instance (and pg pool) per process, surviving HMR and repeated module evaluation.
const globalForAuth = globalThis as typeof globalThis & { __devmentorAuth?: Auth };

export function getAuth(): Auth {
  globalForAuth.__devmentorAuth ??= createAuth();
  return globalForAuth.__devmentorAuth;
}
