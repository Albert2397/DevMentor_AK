// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { promoteToAdmin } from "./admin";

function pool(rowCount: number | null) {
  return { query: vi.fn(() => Promise.resolve({ rowCount })) };
}

describe("promoteToAdmin", () => {
  it("sets the admin role for the given email", async () => {
    const fake = pool(1);

    await expect(promoteToAdmin(fake as never, "alice@example.com")).resolves.toBe(true);
    expect(fake.query).toHaveBeenCalledWith('update "user" set role = $1 where email = $2', [
      "admin",
      "alice@example.com",
    ]);
  });

  it("reports false when no user has the email", async () => {
    await expect(promoteToAdmin(pool(0) as never, "nobody@example.com")).resolves.toBe(false);
  });

  it("reports false when the driver returns no row count", async () => {
    await expect(promoteToAdmin(pool(null) as never, "nobody@example.com")).resolves.toBe(false);
  });
});
