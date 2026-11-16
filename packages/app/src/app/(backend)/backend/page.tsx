import { Suspense } from "react";
import { connection } from "next/server";
import { isAdmin } from "@devmentor/core";
import { Alert, AlertDescription, AlertTitle } from "@devmentor/ui/components/alert";
import { Badge } from "@devmentor/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/card";
import { Separator } from "@devmentor/ui/components/separator";

import { requireActor } from "@/server/auth/session";
import { getRequestScope } from "@/server/container";

import { SignOutButton } from "../_components/sign-out-button";

async function SystemHealth() {
  await connection();
  const report = await getRequestScope().resolve("healthService").check();
  const up = report.database === "up";
  return (
    <Badge variant={up ? "secondary" : "destructive"}>
      Database {up ? "connected" : "unavailable"}
    </Badge>
  );
}

async function AdminContent() {
  const actor = await requireActor();
  if (!isAdmin(actor)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>The panel is available to administrators only.</AlertDescription>
      </Alert>
    );
  }

  const profiles = await getRequestScope().resolve("userProfileService").listProfiles(actor);
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>System status</h2>
          </CardTitle>
          <CardDescription>Live check of the services the app depends on.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Badge variant="outline">Checking…</Badge>}>
            <SystemHealth />
          </Suspense>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Profiles</h2>
          </CardTitle>
          <CardDescription>Most recently updated first.</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No profiles yet.</p>
          ) : (
            <ul className="flex flex-col">
              {profiles.map((profile, index) => (
                <li key={profile.id}>
                  {index > 0 ? <Separator className="my-3" /> : null}
                  <p className="font-medium">{profile.displayName}</p>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {profile.bio ?? "No bio."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BackendHomePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
          <p className="text-muted-foreground text-sm">DevMentor administration.</p>
        </div>
        <SignOutButton />
      </header>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}
