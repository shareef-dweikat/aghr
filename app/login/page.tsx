import { LoginForm } from "../components/login-form";
import defaultTranslations from "../translations/default.json";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <div className="flex w-full max-w-sm flex-col px-6">
        <LoginForm copy={defaultTranslations.login} />
      </div>
    </div>
  );
}
