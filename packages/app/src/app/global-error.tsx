"use client";

// Replaces the root layout, so it carries its own document and inline styles.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#141313",
          color: "#edf5cd",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
