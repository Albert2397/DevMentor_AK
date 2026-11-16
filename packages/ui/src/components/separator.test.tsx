import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Separator } from "./separator";

afterEach(cleanup);

describe("Separator", () => {
  it("is horizontal by default", () => {
    render(<Separator className="extra" />);

    const separator = screen.getByRole("separator");
    expect(separator.dataset.slot).toBe("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("horizontal");
    expect(separator.className).toContain("extra");
  });

  it("can be vertical", () => {
    render(<Separator orientation="vertical" />);

    expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("vertical");
  });
});
