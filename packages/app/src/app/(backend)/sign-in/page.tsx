import type { Metadata } from "next";

import { AuthCard } from "../_components/auth-card";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · DevMentor" };

export default function SignInPage() {
  return (
    <AuthCard title="Sign in" description="Use the email and password you registered with.">
      <SignInForm />
    </AuthCard>
  );
}
