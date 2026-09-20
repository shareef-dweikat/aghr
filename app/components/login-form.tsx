"use client";

import { Suspense } from "react";

import { useAuth } from "../lib/auth/auth-context";
import { AuthField, AuthForm } from "./auth-form";

type LoginCopy = {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  submit: string;
  noAccount: string;
  signupLink: string;
};

function LoginFormInner({ copy }: { copy: LoginCopy }) {
  const { signIn } = useAuth();

  return (
    <AuthForm
      copy={copy}
      footerPrompt={copy.noAccount}
      footerHref="/signup"
      footerLink={copy.signupLink}
      onSubmit={async (formData) => {
        await signIn({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        });
      }}
    >
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
        autoComplete="current-password"
        required
      />
    </AuthForm>
  );
}

export function LoginForm({ copy }: { copy: LoginCopy }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner copy={copy} />
    </Suspense>
  );
}
