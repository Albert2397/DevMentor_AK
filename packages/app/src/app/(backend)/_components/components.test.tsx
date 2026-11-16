import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), refresh: vi.fn() };
const signOut = vi.fn(() => Promise.resolve({ data: null, error: null }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }));

const { AuthCard } = await import("./auth-card");
const { SignOutButton } = await import("./sign-out-button");

afterEach(cleanup);

describe("AuthCard", () => {
  it("renders the title as the page heading, the description and the content", () => {
    render(
      <AuthCard title="Sign in" description="Use your email.">
        <p>form</p>
      </AuthCard>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeDefined();
    expect(screen.getByText("Use your email.")).toBeDefined();
    expect(screen.getByText("form")).toBeDefined();
  });
});

describe("SignOutButton", () => {
  it("signs out, then sends the user to sign-in and refreshes server data", async () => {
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
    expect(signOut).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledWith("/sign-in");
  });
});
