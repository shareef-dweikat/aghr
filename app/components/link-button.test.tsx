import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LinkButton } from "./link-button";

vi.mock("next/link", () => ({
  default: function MockLink({
    children,
    href,
    ...props
  }: ComponentProps<"a"> & { href: string; children?: ReactNode }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

afterEach(() => {
  cleanup();
});

describe("LinkButton", () => {
  it("when enabled, runs caller onClick and does not prevent default", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <LinkButton href="/chat" onClick={onClick}>
        Open
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "Open" });
    await user.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]?.[0].defaultPrevented).toBe(false);
    expect(link).not.toHaveAttribute("aria-disabled");
    expect(link).not.toHaveAttribute("tabindex", "-1");
  });

  it("when disabled, exposes a11y signals and blocks click without calling onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <LinkButton href="/" disabled onClick={onClick}>
        New
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "New" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");

    await user.click(link);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("when disabled, prevents default on auxclick and ignores caller onAuxClick", () => {
    const onAuxClick = vi.fn();

    render(
      <LinkButton href="/" disabled onAuxClick={onAuxClick}>
        New
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "New" });
    const event = new MouseEvent("auxclick", {
      bubbles: true,
      cancelable: true,
      button: 1,
    });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onAuxClick).not.toHaveBeenCalled();
  });

  it("when enabled, forwards onAuxClick", () => {
    const onAuxClick = vi.fn();

    render(
      <LinkButton href="/chat" onAuxClick={onAuxClick}>
        Open
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "Open" });
    link.dispatchEvent(
      new MouseEvent("auxclick", {
        bubbles: true,
        cancelable: true,
        button: 1,
      }),
    );

    expect(onAuxClick).toHaveBeenCalledTimes(1);
  });
});
