import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@devmentor/ui/components/theme-provider";

import { getRequestScope } from "@/server/container";

import "./backend.css";

export function generateMetadata(): Metadata {
  const { title } = getRequestScope().resolve("appInfo").getMetadata();
  return { title: `${title} · Panel`, robots: { index: false, follow: false } };
}

export default function BackendLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
