import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  findAsyncElement,
  renderAsyncElement,
  withAsyncPlaceholders,
} from "@/testing/server-components";

const admin = { userId: "u-admin", role: "admin" as const, name: "Admin" };
const member = { userId: "u-1", role: "user" as const, name: "Alice" };
const requireActor = vi.fn(() => Promise.resolve<typeof admin | typeof member>(admin));
const listProfiles = vi.fn(() => Promise.resolve<ProfileRow[]>([]));
const check = vi.fn(() => Promise.resolve({ status: "ok", database: "up" }));
const connection = vi.fn(() => Promise.resolve());

type ProfileRow = { id: string; displayName: string; bio: string | null };

vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/auth/session", () => ({ requireActor }));
vi.mock("@/server/container", () => ({
  getRequestScope: () => ({
    resolve: (name: string) => (name === "healthService" ? { check } : { listProfiles }),
  }),
}));
vi.mock("../_components/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

const { default: BackendHomePage } = await import("./page");

async function adminContent(): Promise<ReactNode> {
  return renderAsyncElement(findAsyncElement(BackendHomePage(), "AdminContent"));
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("BackendHomePage", () => {
  it("renders the panel shell with the admin content streamed inside Suspense", () => {
    render(withAsyncPlaceholders(BackendHomePage()));

    expect(screen.getByRole("heading", { level: 1, name: "Panel" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined();
    expect(screen.getByTestId("async:AdminContent")).toBeDefined();
  });

  it("denies regular members without loading any profiles", async () => {
    requireActor.mockResolvedValueOnce(member);

    render(await adminContent());

    expect(screen.getByText("Access denied")).toBeDefined();
    expect(listProfiles).not.toHaveBeenCalled();
  });

  it("shows an empty state when there are no profiles", async () => {
    render(withAsyncPlaceholders(await adminContent()));

    expect(listProfiles).toHaveBeenCalledWith(admin);
    expect(screen.getByRole("heading", { level: 2, name: "System status" })).toBeDefined();
    expect(screen.getByText("No profiles yet.")).toBeDefined();
    expect(screen.getByTestId("async:SystemHealth")).toBeDefined();
  });

  it("lists profiles with a separator between them and a placeholder for a missing bio", async () => {
    listProfiles.mockResolvedValueOnce([
      { id: "p-1", displayName: "Ada", bio: "Reviews PRs" },
      { id: "p-2", displayName: "Grace", bio: null },
    ]);

    const { container } = render(withAsyncPlaceholders(await adminContent()));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Reviews PRs")).toBeDefined();
    expect(screen.getByText("No bio.")).toBeDefined();
    expect(container.querySelectorAll('[data-slot="separator"]')).toHaveLength(1);
  });

  it.each([
    ["up", "Database connected"],
    ["down", "Database unavailable"],
  ])("reports the database as %s at request time", async (database, label) => {
    check.mockResolvedValueOnce({ status: database === "up" ? "ok" : "degraded", database });

    render(await renderAsyncElement(findAsyncElement(await adminContent(), "SystemHealth")));

    expect(connection).toHaveBeenCalledOnce();
    expect(screen.getByText(label)).toBeDefined();
  });
});
