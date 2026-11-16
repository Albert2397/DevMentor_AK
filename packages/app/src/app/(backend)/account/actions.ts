"use server";

import { revalidatePath } from "next/cache";
import { DomainError, updateProfileSchema, type UserProfileDto } from "@devmentor/core";

import { getActor } from "@/server/auth/session";
import { getRequestScope } from "@/server/container";

export type UpdateProfileResult =
  | { ok: true; profile: UserProfileDto }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: Partial<Record<"displayName" | "bio", string[]>>;
    };

export async function updateProfile(input: unknown): Promise<UpdateProfileResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const actor = await getActor();
  if (!actor) {
    return { ok: false, formError: "Your session has expired. Sign in again." };
  }

  try {
    const profile = await getRequestScope()
      .resolve("userProfileService")
      .updateOwnProfile(actor, parsed.data);
    revalidatePath("/account");
    return { ok: true, profile };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, formError: error.message };
    }
    throw error;
  }
}
