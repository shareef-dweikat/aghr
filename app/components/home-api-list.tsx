"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import defaultTranslations from "../translations/default.json";

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

function statusLabel(status: CardStatus, copy: Availability): string {
  return copy[STATUS_LABEL_KEYS[status]];
}

function statusClassName(status: CardStatus): string {
  return STATUS_CLASS_NAMES[status];
}

export function HomeApiList({
}: {
}) {
  const { apis, availability }: { apis: HomeApi[], availability: Availability } = defaultTranslations.home;
  const [statuses, setStatuses] = useState<Partial<Record<string, CardStatus>>>(
    {},
  );

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

  return (
    <ul className="flex flex-col gap-3">
      {apis.map((api) => {
        const status = statuses[api.id] ?? "checking";
        const cardClassName =
          "flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900";
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
              {statusLabel(status, availability)}
            </span>
          </>
        );

        return (
          <li key={api.id}>
            {api.href ? (
              <Link
                href={api.href}
                className={`${cardClassName} transition hover:border-zinc-400 dark:hover:border-zinc-600`}
              >
                {body}
              </Link>
            ) : (
              <div className={cardClassName}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
