import type { ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const received: Record<string, unknown>[] = [];

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children, ...props }: { children: ReactNode }) => {
    received.push(props);
    return <>{children}</>;
  },
}));

const { ThemeProvider } = await import("./theme-provider");

afterEach(cleanup);

describe("ThemeProvider", () => {
  it("renders children with class-based, system-aware defaults", () => {
    render(
      <ThemeProvider>
        <p>Panel</p>
      </ThemeProvider>,
    );

    expect(screen.getByText("Panel")).toBeTruthy();
    expect(received.at(-1)).toEqual({
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      disableTransitionOnChange: true,
    });
  });

  it("lets callers override the defaults", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <p>Dark</p>
      </ThemeProvider>,
    );

    expect(received.at(-1)).toMatchObject({ attribute: "class", defaultTheme: "dark" });
  });
});
