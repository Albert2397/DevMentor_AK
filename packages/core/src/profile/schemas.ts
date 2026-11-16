import { z } from "zod";

// Input and output types are identical, so the same schema validates the form and the Server Action.
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(60, "Use at most 60 characters."),
  bio: z.string().trim().max(500, "Use at most 500 characters."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
