import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AuthResult = { data: unknown; error: { message?: string } | null };

const router = { push: vi.fn(), refresh: vi.fn() };
const signUpEmail = vi.fn<(values: unknown) => Promise<AuthResult>>();

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signUp: { email: signUpEmail } } }));

const { SignUpForm } = await import("./sign-up-form");

function fillAndSubmit(name: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  render(<SignUpForm />);
});
afterEach(cleanup);

describe("SignUpForm", () => {
  it("describes the password rule and validates every field on the client", async () => {
    expect(screen.getByText("At least 8 characters.")).toBeDefined();

    fillAndSubmit("A", "nope", "short");

    expect(await screen.findByText("Use at least 2 characters.")).toBeDefined();
    expect(screen.getByText("Enter a valid email address.")).toBeDefined();
    expect(screen.getByText("Use at least 8 characters.")).toBeDefined();
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("creates the account and moves to the account page", async () => {
    let finish: (result: AuthResult) => void = () => undefined;
    signUpEmail.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));

    fillAndSubmit(" Alice ", "alice@example.com", "secret-pass");

    expect(await screen.findByRole("button", { name: "Creating account…" })).toHaveProperty(
      "disabled",
      true,
    );
    finish({ data: {}, error: null });
    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
    expect(signUpEmail).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@example.com",
      password: "secret-pass",
    });
    expect(router.push).toHaveBeenCalledWith("/account");
  });

  it("shows the auth error", async () => {
    signUpEmail.mockResolvedValueOnce({ data: null, error: { message: "User already exists" } });

    fillAndSubmit("Alice", "alice@example.com", "secret-pass");

    expect(await screen.findByText("User already exists")).toBeDefined();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the error has none", async () => {
    signUpEmail.mockResolvedValueOnce({ data: null, error: {} });

    fillAndSubmit("Alice", "alice@example.com", "secret-pass");

    expect(await screen.findByText("Could not create the account.")).toBeDefined();
  });

  it("links to sign-in", () => {
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/sign-in");
  });
});
