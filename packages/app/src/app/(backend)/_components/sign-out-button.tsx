"use client";

import { useRouter } from "next/navigation";
import { Button } from "@devmentor/ui/components/button";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}
