import type { Metadata } from "next";

import { AuthCard } from "../_components/auth-card";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Sign up · DevMentor" };

export default function SignUpPage() {
  return (
    <AuthCard title="Create an account" description="Join DevMentor with your email address.">
      <SignUpForm />
    </AuthCard>
  );
}
