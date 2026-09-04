"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import defaultTranslations from "../translations/default.json";

const accountLinks = [
  { href: "/login", key: "login" as const },
  { href: "/signup", key: "signup" as const },
];

function linkClassName(isActive: boolean) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
    }`;
}

export function SiteDrawer() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<[]>([]);
  const pathname = usePathname();
  const { nav } = defaultTranslations;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);


  useEffect(() => {
    if (!open) {
      return;
    }

    setConversations([]);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? nav.closeMenu : nav.openMenu}
        aria-expanded={open}
        aria-controls="site-drawer"
        onClick={() => setOpen((current) => !current)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={() => setOpen(false)}
      />

      <aside
        id="site-drawer"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white pt-20 pb-4 transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${open ? "translate-x-0" : "pointer-events-none -translate-x-full"
          }`}
      >
        <nav className="flex min-h-0 flex-1 flex-col px-4" aria-label={nav.menu}>
          <Link
            href="/"
            className={`${linkClassName(pathname === "/")} mb-3 flex items-center gap-2`}
          >
            <PlusIcon />
            {nav.new}
          </Link>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                {nav.noConversations}
              </p>
            ) : (
              conversations.map((conversation) => {
                const href = `/chat/${conversation.id}`;

                return (
                  <Link
                    key={conversation.id}
                    href={href}
                    className={`${linkClassName(pathname === href)} truncate`}
                  >
                    {conversation.title}
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {accountLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClassName(pathname === link.href)}
              >
                {nav[link.key]}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
