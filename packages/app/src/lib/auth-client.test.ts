import { describe, expect, it, vi } from "vitest";

const { createAuthClient, adminClient } = vi.hoisted(() => ({
  createAuthClient: vi.fn(() => ({ client: true })),
  adminClient: vi.fn(() => ({ id: "admin-client" })),
}));

vi.mock("better-auth/react", () => ({ createAuthClient }));
vi.mock("better-auth/client/plugins", () => ({ adminClient }));

describe("authClient", () => {
  it("is a Better Auth React client with the admin plugin", async () => {
    const { authClient } = await import("./auth-client");

    expect(authClient).toEqual({ client: true });
    expect(createAuthClient).toHaveBeenCalledWith({ plugins: [{ id: "admin-client" }] });
  });
});
