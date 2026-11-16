"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput, type UserProfileDto } from "@devmentor/core";
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
import { Textarea } from "@devmentor/ui/components/textarea";

import { updateProfile } from "./actions";

export function ProfileForm({ profile }: { profile: UserProfileDto }) {
  const [status, setStatus] = useState<{ kind: "saved" | "error"; message: string } | null>(null);
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { displayName: profile.displayName, bio: profile.bio ?? "" },
  });

  async function onSubmit(values: UpdateProfileInput) {
    setStatus(null);
    const result = await updateProfile(values);
    if (result.ok) {
      form.reset({ displayName: result.profile.displayName, bio: result.profile.bio ?? "" });
      setStatus({ kind: "saved", message: "Profile saved." });
      return;
    }
    for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
      form.setError(name as keyof UpdateProfileInput, { message: messages[0] });
    }
    if (result.formError) {
      setStatus({ kind: "error", message: result.formError });
    }
  }

  return (
    <form noValidate onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <FieldGroup>
        {status ? (
          <Alert variant={status.kind === "error" ? "destructive" : "default"} role="status">
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        ) : null}
        <Controller
          name="displayName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-display-name">Display name</FieldLabel>
              <Input {...field} id="profile-display-name" aria-invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="bio"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea {...field} id="profile-bio" rows={4} aria-invalid={fieldState.invalid} />
              <FieldDescription>Optional, up to 500 characters.</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Button type="submit" className="self-start" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save profile"}
        </Button>
      </FieldGroup>
    </form>
  );
}
