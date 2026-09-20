"use client";

import { Suspense } from "react";

import { useAuth } from "../lib/auth/auth-context";
import { AuthField, AuthForm } from "./auth-form";

type SignupCopy = {
  title: string;
  subtitle: string;
  name: string;
  email: string;
  password: string;
  submit: string;
  hasAccount: string;
  loginLink: string;
};

function SignupFormInner({ copy }: { copy: SignupCopy }) {
  const { signUp } = useAuth();

  return (
    <AuthForm
      copy={copy}
      footerPrompt={copy.hasAccount}
      footerHref="/login"
      footerLink={copy.loginLink}
      onSubmit={async (formData) => {
        await signUp({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        });
      }}
    >
      <AuthField
        label={copy.name}
        type="text"
        name="name"
        autoComplete="name"
        required
      />
      <AuthField
        label={copy.email}
        type="email"
        name="email"
        autoComplete="email"
        required
      />
      <AuthField
        label={copy.password}
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
    </AuthForm>
  );
}

export function SignupForm({ copy }: { copy: SignupCopy }) {
  return (
    <Suspense fallback={null}>
      <SignupFormInner copy={copy} />
    </Suspense>
  );
}
