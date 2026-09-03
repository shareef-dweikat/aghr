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

export function LoginForm({ copy }: { copy: LoginCopy }) {
  return (
    <AuthForm
      copy={copy}
      footerPrompt={copy.noAccount}
      footerHref="/signup"
      footerLink={copy.signupLink}
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
