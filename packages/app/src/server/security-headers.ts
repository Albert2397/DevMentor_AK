export type Header = { key: string; value: string };

export function buildSecurityHeaders(nodeEnv: string): Header[] {
  const csp = ["base-uri 'self'", "form-action 'self'", "object-src 'none'"];
  // Framing is blocked only in production: the sandbox preview embeds the dev server in an iframe.
  if (nodeEnv === "production") {
    csp.push("frame-ancestors 'none'");
  }
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Content-Security-Policy", value: csp.join("; ") },
  ];
}
