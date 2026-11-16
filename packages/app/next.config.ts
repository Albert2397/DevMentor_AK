import type { NextConfig } from "next";

import { env } from "./src/env";
import { buildSecurityHeaders } from "./src/server/security-headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  experimental: {
    globalNotFound: true,
  },
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: buildSecurityHeaders(env.NODE_ENV) }]);
  },
};

export default nextConfig;
