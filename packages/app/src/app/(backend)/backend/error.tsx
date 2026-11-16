"use client";

import { Alert, AlertDescription, AlertTitle } from "@devmentor/ui/components/alert";
import { Button } from "@devmentor/ui/components/button";

export default function BackendError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6 md:p-10">
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>This part of the panel could not be loaded.</AlertDescription>
      </Alert>
      <Button className="self-start" onClick={() => retry()}>
        Try again
      </Button>
    </main>
  );
}
