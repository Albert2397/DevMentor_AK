import { defineEntity, p } from "@mikro-orm/core";
import { v7 as uuidv7 } from "uuid";

export const UserProfileSchema = defineEntity({
  name: "UserProfile",
  tableName: "user_profile",
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => uuidv7()),
    userId: p.string().unique(),
    displayName: p.string().length(60),
    bio: p.text().nullable(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export class UserProfileEntity extends UserProfileSchema.class {
  // nullable() types the property as optional; the column always holds a value or NULL.
  declare bio: string | null;
}
UserProfileSchema.setClass(UserProfileEntity);
