import { SignupForm } from "../components/signup-form";
import defaultTranslations from "../translations/default.json";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <div className="flex w-full max-w-sm flex-col px-6">
        <SignupForm copy={defaultTranslations.signup} />
      </div>
    </div>
  );
}
