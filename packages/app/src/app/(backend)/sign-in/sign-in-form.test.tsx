import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AuthResult = { data: unknown; error: { message?: string } | null };

const router = { push: vi.fn(), refresh: vi.fn() };
const signInEmail = vi.fn<(values: unknown) => Promise<AuthResult>>();

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { email: signInEmail } } }));

const { SignInForm } = await import("./sign-in-form");

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  render(<SignInForm />);
});
afterEach(cleanup);

describe("SignInForm", () => {
  it("validates input on the client without calling the auth API", async () => {
    fillAndSubmit("not-an-email", "");

    expect(await screen.findByText("Enter a valid email address.")).toBeDefined();
    expect(screen.getByText("Enter your password.")).toBeDefined();
    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe("true");
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("signs in and moves to the account page", async () => {
    let finish: (result: AuthResult) => void = () => undefined;
    signInEmail.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));

    fillAndSubmit("alice@example.com", "secret-pass");

    expect(await screen.findByRole("button", { name: "Signing in…" })).toHaveProperty(
      "disabled",
      true,
    );
    finish({ data: {}, error: null });
    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
    expect(signInEmail).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "secret-pass",
    });
    expect(router.push).toHaveBeenCalledWith("/account");
  });

  it("shows the auth error and stays on the page", async () => {
    signInEmail.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid email or password" },
    });

    fillAndSubmit("alice@example.com", "wrong");

    expect(await screen.findByText("Invalid email or password")).toBeDefined();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the error has none", async () => {
    signInEmail.mockResolvedValueOnce({ data: null, error: {} });

    fillAndSubmit("alice@example.com", "wrong");

    expect(await screen.findByText("Could not sign in.")).toBeDefined();
  });

  it("links to sign-up", () => {
    expect(screen.getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe("/sign-up");
  });
});
