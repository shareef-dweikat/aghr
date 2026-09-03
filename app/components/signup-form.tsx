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

export function SignupForm({ copy }: { copy: SignupCopy }) {
  return (
    <AuthForm
      copy={copy}
      footerPrompt={copy.hasAccount}
      footerHref="/login"
      footerLink={copy.loginLink}
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
