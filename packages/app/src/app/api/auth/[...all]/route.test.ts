// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const handlers = { GET: vi.fn(), POST: vi.fn() };
  return { handlers, auth: { handler: vi.fn() }, toNextJsHandler: vi.fn(() => handlers) };
});

vi.mock("better-auth/next-js", () => ({ toNextJsHandler: mocks.toNextJsHandler }));
vi.mock("@/server/auth/auth", () => ({ getAuth: () => mocks.auth }));

import { GET, POST } from "./route";

// Captured at import: the handler is built once per module, and mock history is cleared per test.
const handlerCalls = [...mocks.toNextJsHandler.mock.calls];

describe("/api/auth/[...all]", () => {
  it("delegates GET and POST to Better Auth", () => {
    expect(handlerCalls).toEqual([[mocks.auth]]);
    expect(GET).toBe(mocks.handlers.GET);
    expect(POST).toBe(mocks.handlers.POST);
  });
});
