import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

afterEach(cleanup);

describe("Card", () => {
  it("renders every slot and merges class names", () => {
    render(
      <Card className="extra" data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card.dataset.slot).toBe("card");
    expect(card.dataset.size).toBe("default");
    expect(card.className).toContain("extra");
    for (const [text, slot] of [
      ["Title", "card-title"],
      ["Description", "card-description"],
      ["Action", "card-action"],
      ["Content", "card-content"],
      ["Footer", "card-footer"],
    ] as const) {
      expect(screen.getByText(text).dataset.slot).toBe(slot);
    }
    expect(screen.getByText("Title").parentElement?.dataset.slot).toBe("card-header");
  });

  it("supports the small size", () => {
    render(<Card size="sm" data-testid="card" />);

    expect(screen.getByTestId("card").dataset.size).toBe("sm");
  });
});
