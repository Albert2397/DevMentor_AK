// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

function request(cookie?: string) {
  return new NextRequest("http://localhost:3000/account", {
    headers: cookie ? { cookie } : {},
  });
}

describe("proxy", () => {
  it("redirects requests without a session cookie to sign-in", () => {
    const response = proxy(request());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in");
  });

  it("lets requests with a session cookie through", () => {
    const response = proxy(request("better-auth.session_token=token.signature"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("guards only the account and panel areas", () => {
    expect(config.matcher).toEqual(["/account/:path*", "/backend/:path*"]);
  });
});
