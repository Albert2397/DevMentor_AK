import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("renders a button with the default variant and size", () => {
    const onClick = vi.fn();
    render(
      <Button className="extra" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.dataset.slot).toBe("button");
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("extra");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies variant and size", () => {
    render(
      <Button variant="outline" size="sm">
        Cancel
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Cancel" });
    expect(button.className).toContain("border-border");
    expect(button.className).toContain("h-7");
  });

  it("does not fire clicks when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Off" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("exposes its variant classes", () => {
    expect(buttonVariants({ variant: "link", size: "icon" })).toContain("size-8");
  });
});
