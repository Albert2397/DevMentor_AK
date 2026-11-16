import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./sign-in/sign-in-form", () => ({ SignInForm: () => <form aria-label="sign-in form" /> }));
vi.mock("./sign-up/sign-up-form", () => ({ SignUpForm: () => <form aria-label="sign-up form" /> }));

const signIn = await import("./sign-in/page");
const signUp = await import("./sign-up/page");

afterEach(cleanup);

describe.each([
  ["sign-in", signIn, "Sign in", "Sign in · DevMentor", "sign-in form"],
  ["sign-up", signUp, "Create an account", "Sign up · DevMentor", "sign-up form"],
])("%s page", (_name, page, heading, title, formName) => {
  it("wraps its form in an auth card with a page title", () => {
    render(<page.default />);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeDefined();
    expect(screen.getByRole("form", { name: formName })).toBeDefined();
    expect(page.metadata.title).toBe(title);
  });
});
