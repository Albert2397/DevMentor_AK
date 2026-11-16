import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BackendError from "./(backend)/backend/error";
import FrontendError from "./(frontend)/error";
import GlobalError from "./global-error";
import GlobalNotFound, { metadata as notFoundMetadata } from "./global-not-found";

afterEach(cleanup);

describe.each([
  ["GlobalError", GlobalError, "Something went wrong."],
  ["FrontendError", FrontendError, "Something went wrong."],
  ["BackendError", BackendError, "Something went wrong"],
])("%s", (_name, ErrorPage, message) => {
  it("explains the failure and retries on request", () => {
    const retry = vi.fn();
    render(<ErrorPage error={new Error("boom")} retry={retry} />);

    expect(screen.getByText(message)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("GlobalNotFound", () => {
  it("links back to the home page", () => {
    render(<GlobalNotFound />);

    expect(screen.getByRole("heading", { name: "Page not found." })).toBeDefined();
    expect(screen.getByRole("link", { name: "Go to the home page" }).getAttribute("href")).toBe(
      "/",
    );
    expect(notFoundMetadata.title).toBe("Page not found · DevMentor");
  });
});
