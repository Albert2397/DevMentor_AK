import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";

afterEach(cleanup);

describe("Field layout", () => {
  it("renders a vertical field group with label, content, title and description", () => {
    render(
      <FieldSet className="set">
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup className="group">
          <Field className="extra" data-testid="field">
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldContent>
              <FieldTitle>Title</FieldTitle>
              <FieldDescription>Help</FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>,
    );

    const field = screen.getByTestId("field");
    expect(field.dataset.slot).toBe("field");
    expect(field.dataset.orientation).toBe("vertical");
    expect(field.className).toContain("flex-col");
    expect(field.className).toContain("extra");
    expect(screen.getByText("Profile").dataset.variant).toBe("legend");
    expect(screen.getByText("Name").dataset.slot).toBe("field-label");
    expect(screen.getByText("Title").dataset.slot).toBe("field-label");
    expect(screen.getByText("Help").dataset.slot).toBe("field-description");
    expect(screen.getByText("Title").parentElement?.dataset.slot).toBe("field-content");
    expect(field.parentElement?.dataset.slot).toBe("field-group");
    expect(field.parentElement?.parentElement?.dataset.slot).toBe("field-set");
  });

  it("supports horizontal and responsive orientations and the label legend variant", () => {
    render(
      <>
        <FieldLegend variant="label">Small</FieldLegend>
        <Field orientation="horizontal" data-testid="horizontal" />
        <Field orientation="responsive" data-testid="responsive" />
      </>,
    );

    expect(screen.getByText("Small").dataset.variant).toBe("label");
    expect(screen.getByTestId("horizontal").className).toContain("flex-row");
    expect(screen.getByTestId("responsive").dataset.orientation).toBe("responsive");
  });
});

describe("FieldSeparator", () => {
  it("renders a plain separator without content", () => {
    const { container } = render(<FieldSeparator className="extra" />);

    const separator = container.querySelector("[data-slot=field-separator]");
    expect(separator?.getAttribute("data-content")).toBe("false");
    expect(separator?.className).toContain("extra");
    expect(container.querySelector("[data-slot=field-separator-content]")).toBeNull();
  });

  it("renders its label between the lines", () => {
    render(<FieldSeparator>or</FieldSeparator>);

    const label = screen.getByText("or");
    expect(label.dataset.slot).toBe("field-separator-content");
    expect(label.parentElement?.dataset.content).toBe("true");
  });
});

describe("FieldError", () => {
  it("renders nothing without errors", () => {
    const { container } = render(<FieldError />);

    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for an empty error list", () => {
    const { container } = render(<FieldError errors={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when the only error has no message", () => {
    const { container } = render(<FieldError errors={[undefined]} />);

    expect(container.innerHTML).toBe("");
  });

  it("shows a single message as text", () => {
    render(<FieldError className="extra" errors={[{ message: "Required." }]} />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Required.");
    expect(alert.className).toContain("extra");
  });

  it("deduplicates repeated messages", () => {
    render(<FieldError errors={[{ message: "Required." }, { message: "Required." }]} />);

    expect(screen.getByRole("alert").textContent).toBe("Required.");
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("lists distinct messages and skips entries without one", () => {
    render(<FieldError errors={[{ message: "Too short." }, undefined, { message: "Invalid." }]} />);

    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual(["Too short.", "Invalid."]);
  });

  it("prefers explicit children over errors", () => {
    render(<FieldError errors={[{ message: "Ignored." }]}>Custom</FieldError>);

    expect(screen.getByRole("alert").textContent).toBe("Custom");
  });
});
