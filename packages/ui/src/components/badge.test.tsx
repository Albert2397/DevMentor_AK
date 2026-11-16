import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge, badgeVariants } from "./badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders a span with the default variant", () => {
    render(<Badge className="extra">New</Badge>);

    const badge = screen.getByText("New");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("bg-primary");
    expect(badge.className).toContain("extra");
  });

  it("applies a variant and renders into a custom element", () => {
    render(
      <Badge variant="destructive" render={<a href="/x" />}>
        Down
      </Badge>,
    );

    const badge = screen.getByRole("link", { name: "Down" });
    expect(badge.getAttribute("href")).toBe("/x");
    expect(badge.className).toContain("text-destructive");
  });

  it("exposes its variant classes", () => {
    expect(badgeVariants({ variant: "outline" })).toContain("border-border");
  });
});
