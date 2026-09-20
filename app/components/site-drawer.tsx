"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { useAuth } from "../lib/auth/auth-context";
import { LinkButton } from "./link-button";
import {
  listConversations,
  type Conversation,
} from "../lib/conversations";
import defaultTranslations from "../translations/default.json";

const AUTH_PATHS = new Set(["/login", "/signup"]);

function linkClassName(isActive: boolean) {
  if (isActive) {
    return "rounded-lg px-3 py-2 text-sm font-medium transition bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
  }
  return "rounded-lg px-3 py-2 text-sm font-medium transition text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";
}

function useCloseOnNavigate(
  pathname: string,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);
}

function useConversationsWhenOpen(open: boolean, userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let cancelled = false;
    void listConversations(userId).then((next) => {
      if (cancelled) {
        return;
      }
      setConversations(next);
    });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!open || !userId) {
    return [];
  }

  return conversations;
}

function useDrawerLock(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

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
  }, [open, setOpen]);
}

function ConversationLinks({
  conversations,
  pathname,
  emptyLabel,
}: {
  conversations: Conversation[];
  pathname: string;
  emptyLabel: string;
}) {
  if (conversations.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
        {emptyLabel}
      </p>
    );
  }

  return conversations.map((conversation) => {
    const href = `/chat/${conversation.id}`;
    return (
      <LinkButton
        key={conversation.id}
        href={href}
        className={`${linkClassName(pathname === href)} truncate`}
      >
        {conversation.title}
      </LinkButton>
    );
  });
}

function drawerMotionClass(open: boolean, openClass: string, closedClass: string) {
  if (open) {
    return openClass;
  }
  return closedClass;
}

function DrawerChrome({
  open,
  setOpen,
  pathname,
  conversations,
  displayName,
  onLogout,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  pathname: string;
  conversations: Conversation[];
  displayName: string;
  onLogout: () => void;
}) {
  const { nav } = defaultTranslations;
  const panelClassName = drawerMotionClass(
    open,
    "translate-x-0",
    "pointer-events-none -translate-x-full",
  );
  const scrimClassName = drawerMotionClass(
    open,
    "opacity-100",
    "pointer-events-none opacity-0",
  );
  const menuIcon = open ? <CloseIcon /> : <MenuIcon />;
  const menuLabel = open ? nav.closeMenu : nav.openMenu;
  const isHome = pathname === "/";

  return (
    <>
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls="site-drawer"
        onClick={() => setOpen((current) => !current)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
      >
        {menuIcon}
      </button>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity ${scrimClassName}`}
        onClick={() => setOpen(false)}
      />

      <aside
        id="site-drawer"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white pt-20 pb-4 transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${panelClassName}`}
      >
        <nav className="flex min-h-0 flex-1 flex-col px-4" aria-label={nav.menu}>
          <LinkButton
            href="/"
            disabled={isHome}
            className={
              isHome
                ? "mb-3 flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-500"
                : `${linkClassName(false)} mb-3 flex items-center gap-2`
            }
          >
            <PlusIcon />
            {nav.new}
          </LinkButton>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            <ConversationLinks
              conversations={conversations}
              pathname={pathname}
              emptyLabel={nav.noConversations}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="truncate px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400">
              {displayName}
            </p>
            <button
              type="button"
              onClick={onLogout}
              className={`${linkClassName(false)} w-full text-left`}
            >
              {nav.logout}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

function useSiteDrawerState() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const conversations = useConversationsWhenOpen(open, user?.id);
  useCloseOnNavigate(pathname, setOpen);
  useDrawerLock(open, setOpen);

  async function onLogout() {
    setOpen(false);
    await signOut();
    router.replace("/login");
  }

  return {
    open,
    setOpen,
    pathname,
    conversations,
    displayName: user?.displayName ?? user?.email ?? "",
    onLogout,
  };
}

export function SiteDrawer() {
  const { open, setOpen, pathname, conversations, displayName, onLogout } =
    useSiteDrawerState();

  if (AUTH_PATHS.has(pathname)) {
    return null;
  }

  return (
    <DrawerChrome
      open={open}
      setOpen={setOpen}
      pathname={pathname}
      conversations={conversations}
      displayName={displayName}
      onLogout={onLogout}
    />
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
