import { Suspense } from "react";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/card";

import { requireActor } from "@/server/auth/session";
import { getRequestScope } from "@/server/container";

import { SignOutButton } from "../_components/sign-out-button";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Account · DevMentor" };

async function AccountProfile() {
  const actor = await requireActor();
  const profile = await getRequestScope().resolve("userProfileService").getOwnProfile(actor);
  return <ProfileForm profile={profile} />;
}

export default function AccountPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6 md:p-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="text-muted-foreground text-sm">How other DevMentor members see you.</p>
        </div>
        <SignOutButton />
      </header>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Profile</h2>
          </CardTitle>
          <CardDescription>Your display name and a short bio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-muted-foreground text-sm">Loading profile…</p>}>
            <AccountProfile />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
