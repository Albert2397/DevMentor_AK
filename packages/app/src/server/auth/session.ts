import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Actor } from "@devmentor/core";

import { getAuth } from "./auth";

/** The signed-in user as a domain Actor, or null. Cached per request. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }
  const { user } = session;
  return { userId: user.id, role: user.role === "admin" ? "admin" : "user", name: user.name };
});

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) {
    redirect("/sign-in");
  }
  return actor;
}
