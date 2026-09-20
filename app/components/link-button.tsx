"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, MouseEventHandler } from "react";

export type LinkButtonProps = ComponentProps<typeof Link> & {
  disabled?: boolean;
};

function preventNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

export function LinkButton({
  disabled = false,
  onClick,
  onAuxClick,
  ...props
}: LinkButtonProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> | undefined = disabled
    ? preventNavigation
    : onClick;

  const handleAuxClick: MouseEventHandler<HTMLAnchorElement> | undefined =
    disabled ? preventNavigation : onAuxClick;

  return (
    <Link
      {...props}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
    />
  );
}
