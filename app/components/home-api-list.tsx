"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import defaultTranslations from "../translations/default.json";

import {
  EnableChromeAiModal,
  type EnableGuideCopy,
} from "./enable-chrome-ai-modal";
import { LinkButton } from "./link-button";

import {
  checkApiAvailability,
  type ChromeAiAvailabilityStatus,
} from "../lib/chrome-ai";

type HomeApi = {
  id: string;
  name: string;
  description: string;
  href?: string;
};

type Availability = {
  checking: string;
  availableDownloaded: string;
  availableNotDownloaded: string;
  downloading: string;
  unavailable: string;
  unsupported: string;
};

type CardStatus = ChromeAiAvailabilityStatus | "checking";

const STATUS_LABEL_KEYS: Record<CardStatus, keyof Availability> = {
  available: "availableDownloaded",
  downloadable: "availableNotDownloaded",
  downloading: "downloading",
  unavailable: "unavailable",
  unsupported: "unsupported",
  checking: "checking",
};

const STATUS_CLASS_NAMES: Record<CardStatus, string> = {
  available: "text-emerald-700 dark:text-emerald-400",
  downloadable: "text-amber-700 dark:text-amber-400",
  downloading: "text-amber-700 dark:text-amber-400",
  unavailable: "text-zinc-500 dark:text-zinc-500",
  unsupported: "text-zinc-500 dark:text-zinc-500",
  checking: "text-zinc-400 dark:text-zinc-500",
};

const BLOCKED_STATUSES = new Set<CardStatus>(["unsupported", "unavailable"]);

const INTERACTIVE_CARD_CLASS =
  "transition hover:border-zinc-400 dark:hover:border-zinc-600";

function isBlockedStatus(status: CardStatus): boolean {
  return BLOCKED_STATUSES.has(status);
}

function statusLabel(
  status: CardStatus,
  copy: Availability,
  howToEnableHint: string,
): string {
  const base = copy[STATUS_LABEL_KEYS[status]];
  if (isBlockedStatus(status)) {
    return `${base} · ${howToEnableHint}`;
  }
  return base;
}

function statusClassName(status: CardStatus): string {
  return STATUS_CLASS_NAMES[status];
}

export function HomeApiList() {
  const {
    apis,
    availability,
    enableGuide,
  }: {
    apis: HomeApi[];
    availability: Availability;
    enableGuide: EnableGuideCopy & { howToEnableHint: string };
  } = defaultTranslations.home;

  const [statuses, setStatuses] = useState<Partial<Record<string, CardStatus>>>(
    {},
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const activatorRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      apis.map(async (api) => {
        const status = await checkApiAvailability(api.id);
        return [api.id, status] as const;
      }),
    ).then((results) => {
      if (!cancelled) {
        setStatuses(Object.fromEntries(results));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function openGuide(apiId: string) {
    activatorRef.current = cardRefs.current[apiId] ?? null;
    setGuideOpen(true);
  }

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
  }, []);

  const cardClassName =
    "flex w-full flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <>
      <ul className="flex flex-col gap-3">
        {apis.map((api) => {
          const status = statuses[api.id] ?? "checking";
          const blocked = isBlockedStatus(status);
          const body = (
            <>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {api.name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {api.description}
              </span>
              <span
                className={`text-xs ${statusClassName(status)}`}
                role="status"
              >
                {statusLabel(status, availability, enableGuide.howToEnableHint)}
              </span>
            </>
          );

          return (
            <li key={api.id}>
              {blocked ? (
                <button
                  type="button"
                  ref={(node) => {
                    cardRefs.current[api.id] = node;
                  }}
                  className={`${cardClassName} cursor-pointer ${INTERACTIVE_CARD_CLASS}`}
                  aria-haspopup="dialog"
                  onClick={() => openGuide(api.id)}
                >
                  {body}
                </button>
              ) : api.href ? (
                <LinkButton
                  href={api.href}
                  className={`${cardClassName} ${INTERACTIVE_CARD_CLASS}`}
                >
                  {body}
                </LinkButton>
              ) : (
                <div className={cardClassName}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <EnableChromeAiModal
        open={guideOpen}
        onClose={closeGuide}
        returnFocusRef={activatorRef}
        copy={enableGuide}
      />
    </>
  );
}
