// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(() => Promise.resolve(new Headers({ cookie: "c=1" }))),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("./auth", () => ({ getAuth: () => ({ api: { getSession: mocks.getSession } }) }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

async function load() {
  vi.resetModules();
  return import("./session");
}

const session = (role: string | null | undefined) => ({
  user: { id: "u-1", name: "Alice", role },
});

describe("getActor", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
  });

  it("returns null without a session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { getActor } = await load();

    await expect(getActor()).resolves.toBeNull();
  });

  it("reads the session from the request headers", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { getActor } = await load();

    await getActor();

    const [{ headers }] = mocks.getSession.mock.calls[0] as [{ headers: Headers }];
    expect(headers.get("cookie")).toBe("c=1");
  });

  it("maps the admin role", async () => {
    mocks.getSession.mockResolvedValue(session("admin"));
    const { getActor } = await load();

    await expect(getActor()).resolves.toEqual({ userId: "u-1", role: "admin", name: "Alice" });
  });

  it.each(["user", "editor", null, undefined])("maps role %s to user", async (role) => {
    mocks.getSession.mockResolvedValue(session(role));
    const { getActor } = await load();

    await expect(getActor()).resolves.toMatchObject({ role: "user" });
  });
});

describe("requireActor", () => {
  it("returns the signed-in actor", async () => {
    mocks.getSession.mockResolvedValue(session("user"));
    const { requireActor } = await load();

    await expect(requireActor()).resolves.toEqual({ userId: "u-1", role: "user", name: "Alice" });
  });

  it("redirects guests to sign-in", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { requireActor } = await load();

    await expect(requireActor()).rejects.toThrow("redirect:/sign-in");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });
});
