import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Backdrop } from "./Backdrop";

type FakeContext = {
  fillStyle: string;
  globalAlpha: number;
  setTransform: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  getImageData: ReturnType<typeof vi.fn>;
};

function fakeContext(imageData: Uint8ClampedArray = new Uint8ClampedArray(0)): FakeContext {
  return {
    fillStyle: "",
    globalAlpha: 1,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fill: vi.fn(),
    getImageData: vi.fn(() => ({ data: imageData })),
  };
}

const observers: {
  callback: () => void;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}[] = [];

class FakeResizeObserver {
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: () => void) {
    observers.push({ callback, observe: this.observe, disconnect: this.disconnect });
  }
}

class FakePath2D {
  readonly path: string;

  constructor(path: string) {
    this.path = path;
  }
}

type Setup = {
  /** Contexts handed out in order: dune canvas, mark canvas, then offscreen mask canvases. */
  contexts: (FakeContext | null)[];
  canvasSize?: { width: number; height: number };
  /** Right edge of the content the mark keeps clear of; omit to render no content element. */
  contentRight?: number;
  devicePixelRatio?: number;
};

function setup({
  contexts,
  canvasSize = { width: 600, height: 400 },
  contentRight,
  devicePixelRatio = 2,
}: Setup) {
  const queue = [...contexts];
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(
      (() => queue.shift() ?? null) as unknown as HTMLCanvasElement["getContext"],
    );
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
    ...canvasSize,
  } as DOMRect);
  vi.stubGlobal("devicePixelRatio", devicePixelRatio);
  if (contentRight !== undefined) {
    const content = document.createElement("main");
    content.className = "copy";
    content.getBoundingClientRect = () => ({ right: contentRight }) as DOMRect;
    document.body.append(content);
  }
  return { getContext };
}

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("Path2D", FakePath2D);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Backdrop", () => {
  it("renders two hidden canvases and a vignette", () => {
    setup({ contexts: [null, null] });
    const { container } = render(<Backdrop contentSelector=".copy" />);

    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.querySelectorAll("canvas")).toHaveLength(2);
    expect(root?.children).toHaveLength(3);
  });

  it("draws nothing when the browser offers no 2D context", () => {
    setup({ contexts: [null, null] });
    render(<Backdrop contentSelector=".copy" />);

    expect(observers).toHaveLength(0);
  });

  it("draws nothing when only the mark canvas lacks a context", () => {
    const dune = fakeContext();
    setup({ contexts: [dune, null] });
    render(<Backdrop contentSelector=".copy" />);

    expect(dune.fillRect).not.toHaveBeenCalled();
    expect(observers).toHaveLength(0);
  });

  it("draws the dune field without a mark when the content is missing", () => {
    const dune = fakeContext();
    const mark = fakeContext();
    setup({ contexts: [dune, mark] });
    render(<Backdrop contentSelector=".copy" />);

    expect(dune.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(dune.fillRect).toHaveBeenCalled();
    expect(mark.fillRect).not.toHaveBeenCalled();
    expect(dune.globalAlpha).toBe(1);
  });

  it("leaves out the mark when the content runs too close to the edge", () => {
    const dune = fakeContext();
    const mark = fakeContext();
    const { getContext } = setup({ contexts: [dune, mark], contentRight: 500 });
    render(<Backdrop contentSelector=".copy" />);

    expect(getContext).toHaveBeenCalledTimes(2);
    expect(mark.fillRect).not.toHaveBeenCalled();
  });

  it("skips the mask when the offscreen canvas has no context", () => {
    const dune = fakeContext();
    const mark = fakeContext();
    setup({ contexts: [dune, mark, null], contentRight: 100 });
    render(<Backdrop contentSelector=".copy" />);

    expect(dune.fillRect).toHaveBeenCalled();
    expect(mark.fillRect).not.toHaveBeenCalled();
  });

  it("draws the mark in grains where the mask is opaque", () => {
    const width = 600;
    const height = 400;
    const opaque = new Uint8ClampedArray(width * height * 4).fill(255);
    const dune = fakeContext();
    const mark = fakeContext();
    const offscreen = fakeContext(opaque);
    setup({ contexts: [dune, mark, offscreen], canvasSize: { width, height }, contentRight: 100 });
    render(<Backdrop contentSelector=".copy" />);

    expect(offscreen.translate).toHaveBeenCalledWith(140, expect.any(Number));
    expect(offscreen.fill).toHaveBeenCalledWith(expect.any(FakePath2D), "nonzero");
    expect(mark.fillRect).toHaveBeenCalled();
    expect(mark.globalAlpha).toBe(1);
  });

  it("treats mask pixels missing from the image data as transparent", () => {
    // A fractional height lets grains land on a row past the rounded mask, and the short image
    // data leaves most of the mask unread.
    const dune = fakeContext();
    const mark = fakeContext();
    const offscreen = fakeContext(new Uint8ClampedArray(4).fill(255));
    setup({
      contexts: [dune, mark, offscreen],
      canvasSize: { width: 600, height: 400.4 },
      contentRight: 100,
      devicePixelRatio: 0,
    });
    render(<Backdrop contentSelector=".copy" />);

    expect(dune.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(mark.fillRect).not.toHaveBeenCalled();
  });

  it("redraws on resize and stops observing on unmount", () => {
    const dune = fakeContext();
    const mark = fakeContext();
    setup({ contexts: [dune, mark] });
    const { unmount } = render(<Backdrop contentSelector=".copy" />);

    const [observer] = observers;
    expect(observer?.observe).toHaveBeenCalledWith(expect.any(HTMLCanvasElement));
    const drawsBefore = dune.clearRect.mock.calls.length;
    observer?.callback();
    expect(dune.clearRect.mock.calls.length).toBe(drawsBefore + 1);

    unmount();
    expect(observer?.disconnect).toHaveBeenCalled();
  });
});
