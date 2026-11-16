import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";

afterEach(cleanup);

describe("Input", () => {
  it("renders a labelled input of the given type and reports changes", () => {
    render(
      <>
        <Label htmlFor="email" className="extra-label">
          Email
        </Label>
        <Input id="email" type="email" className="extra" defaultValue="" />
      </>,
    );

    const input = screen.getByLabelText<HTMLInputElement>("Email");
    expect(input.type).toBe("email");
    expect(input.dataset.slot).toBe("input");
    expect(input.className).toContain("extra");
    expect(screen.getByText("Email").dataset.slot).toBe("label");
    expect(screen.getByText("Email").className).toContain("extra-label");
    fireEvent.change(input, { target: { value: "a@b.co" } });
    expect(input.value).toBe("a@b.co");
  });
});

describe("Textarea", () => {
  it("renders a textarea with merged class names", () => {
    render(<Textarea aria-label="Bio" className="extra" rows={3} />);

    const textarea = screen.getByRole("textbox", { name: "Bio" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.dataset.slot).toBe("textarea");
    expect(textarea.className).toContain("extra");
  });
});
