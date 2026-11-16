import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getMetadata = vi.fn(() => ({ title: "DevMentor", description: "Mentoring" }));
const resolve = vi.fn(() => ({ getMetadata }));

vi.mock("@/server/container", () => ({ getRequestScope: () => ({ resolve }) }));
vi.mock("@devmentor/ui", () => ({ Backdrop: () => <div data-testid="backdrop" /> }));

const { default: BackendLayout, generateMetadata: backendMetadata } =
  await import("./(backend)/layout");
const { default: FrontendLayout, generateMetadata: frontendMetadata } =
  await import("./(frontend)/layout");
const { default: HomePage } = await import("./(frontend)/page");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("frontend layout", () => {
  it("takes title and description from the app info service and adds the icon", () => {
    const metadata = frontendMetadata();

    expect(resolve).toHaveBeenCalledWith("appInfo");
    expect(metadata).toMatchObject({ title: "DevMentor", description: "Mentoring" });
    expect(String((metadata.icons as { icon: string }).icon)).toMatch(/^data:image\/svg\+xml,/);
  });

  it("renders its children", () => {
    render(
      <FrontendLayout>
        <p>child</p>
      </FrontendLayout>,
    );

    expect(screen.getByText("child")).toBeDefined();
  });
});

describe("backend layout", () => {
  it("suffixes the title and keeps the panel out of search engines", () => {
    expect(backendMetadata()).toEqual({
      title: "DevMentor · Panel",
      robots: { index: false, follow: false },
    });
  });

  it("renders its children inside the theme provider", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    render(
      <BackendLayout>
        <p>panel child</p>
      </BackendLayout>,
    );

    expect(screen.getByText("panel child")).toBeDefined();
  });
});

describe("home page", () => {
  it("shows the starter screen with the backdrop", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Your Next.js app is ready." }),
    ).toBeDefined();
    expect(screen.getByTestId("backdrop")).toBeDefined();
    expect(screen.getByRole("list", { name: "What this workspace runs" })).toBeDefined();
  });
});
