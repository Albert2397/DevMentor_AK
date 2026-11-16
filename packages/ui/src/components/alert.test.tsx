import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

afterEach(cleanup);

describe("Alert", () => {
  it("renders an alert with title, description and action slots", () => {
    render(
      <Alert className="extra">
        <AlertTitle>Title</AlertTitle>
        <AlertDescription className="desc">Details</AlertDescription>
        <AlertAction>Act</AlertAction>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveProperty("dataset.slot", "alert");
    expect(alert.className).toContain("bg-card text-card-foreground");
    expect(alert.className).toContain("extra");
    expect(screen.getByText("Title").dataset.slot).toBe("alert-title");
    expect(screen.getByText("Details").dataset.slot).toBe("alert-description");
    expect(screen.getByText("Details").className).toContain("desc");
    expect(screen.getByText("Act").dataset.slot).toBe("alert-action");
  });

  it("applies the destructive variant", () => {
    render(<Alert variant="destructive">Broken</Alert>);

    expect(screen.getByRole("alert").className).toContain("text-destructive");
  });
});
