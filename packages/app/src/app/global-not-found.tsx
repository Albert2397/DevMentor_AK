import type { Metadata } from "next";
import Link from "next/link";

import "./(frontend)/frontend.css";

export const metadata: Metadata = {
  title: "Page not found · DevMentor",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <div className="starter">
          <main>
            <h1>Page not found.</h1>
            <p className="lede">The page you are looking for does not exist.</p>
            <Link href="/" className="aside">
              Go to the home page
            </Link>
          </main>
        </div>
      </body>
    </html>
  );
}
