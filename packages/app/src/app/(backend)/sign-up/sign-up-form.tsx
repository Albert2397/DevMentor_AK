"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@devmentor/core";
import { Alert, AlertDescription } from "@devmentor/ui/components/alert";
import { Button } from "@devmentor/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@devmentor/ui/components/field";
import { Input } from "@devmentor/ui/components/input";

import { authClient } from "@/lib/auth-client";

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
] as const;

export function SignUpForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setFormError(null);
    const { error } = await authClient.signUp.email(values);
    if (error) {
      setFormError(error.message ?? "Could not create the account.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form noValidate onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <FieldGroup>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`sign-up-${name}`}>{label}</FieldLabel>
                <Input
                  {...field}
                  id={`sign-up-${name}`}
                  type={type}
                  autoComplete={autoComplete}
                  aria-invalid={fieldState.invalid}
                />
                {name === "password" ? (
                  <FieldDescription>At least 8 characters.</FieldDescription>
                ) : null}
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ))}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Already registered?{" "}
          <Link href="/sign-in" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
