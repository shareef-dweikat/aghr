import defaultTranslations from "./translations/default.json";

export default function Home() {
  const { title, subtitle, apis } = defaultTranslations.home;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-8 px-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </header>

        <ul className="flex flex-col gap-3">
          {apis.map((api) => (
            <li
              key={api.name}
              className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{api.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {api.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
