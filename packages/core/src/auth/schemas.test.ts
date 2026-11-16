import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./schemas";

describe("signUpSchema", () => {
  it("accepts a valid registration and trims the name", () => {
    expect(
      signUpSchema.parse({ name: " Alice ", email: "alice@example.com", password: "s3cret-pass" }),
    ).toEqual({
      name: "Alice",
      email: "alice@example.com",
      password: "s3cret-pass",
    });
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(
      signUpSchema.safeParse({ name: "Alice", email: "alice@example.com", password: "short" })
        .success,
    ).toBe(false);
  });

  it("rejects malformed email addresses", () => {
    expect(signInSchema.safeParse({ email: "alice", password: "x" }).success).toBe(false);
  });
});
