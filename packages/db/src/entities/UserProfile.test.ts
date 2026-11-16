import { describe, expect, it } from "vitest";

import { UserProfileEntity, UserProfileSchema } from "./UserProfile";

type PropertyMeta = {
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  length?: number;
  onCreate?: (entity: object, em: unknown) => unknown;
  onUpdate?: (entity: object, em: unknown) => unknown;
};

describe("UserProfile entity", () => {
  const { meta } = UserProfileSchema;
  const properties = meta.properties as unknown as Record<string, PropertyMeta>;
  const property = (name: string): PropertyMeta => {
    const found = properties[name];
    if (!found) throw new Error(`Unknown property ${name}`);
    return found;
  };

  it("maps to an explicit table so minified class names do not matter", () => {
    expect(meta.tableName).toBe("user_profile");
    expect(meta.class).toBe(UserProfileEntity);
  });

  it("generates time-ordered UUID v7 ids on create", () => {
    const id = property("id");
    expect(id.primary).toBe(true);
    expect(String(id.onCreate?.({}, undefined))).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
  });

  it("allows one profile per user and an optional bio", () => {
    expect(property("userId").unique).toBe(true);
    expect(property("displayName").length).toBe(60);
    expect(property("bio").nullable).toBe(true);
  });

  it("timestamps creation and updates", () => {
    for (const name of ["createdAt", "updatedAt"]) {
      expect(property(name).onCreate?.({}, undefined)).toBeInstanceOf(Date);
    }
    expect(property("updatedAt").onUpdate?.({}, undefined)).toBeInstanceOf(Date);
  });
});
