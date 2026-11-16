"use client";

export default function FrontendError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="starter">
      <main>
        <h1>Something went wrong.</h1>
        <p className="lede">The page could not be loaded. Try again in a moment.</p>
        <button type="button" className="status" onClick={() => retry()}>
          Try again
        </button>
      </main>
    </div>
  );
}
