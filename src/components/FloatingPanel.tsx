"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title?: string;
  side?: "left" | "right";
  defaultCollapsed?: boolean;
  className?: string;
  testId?: string;
  mobileSheet?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  children: ReactNode;
};

export function FloatingPanel({
  title,
  side = "left",
  defaultCollapsed = false,
  className = "",
  testId,
  mobileSheet = false,
  mobileOpen = false,
  onMobileClose,
  children
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const showBody = !collapsed || mobileSheet;

  const header = title ? (
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</span>
      <button
        type="button"
        onClick={() => {
          if (mobileSheet && onMobileClose) onMobileClose();
          else setCollapsed((c) => !c);
        }}
        className="min-h-[44px] min-w-[44px] rounded-lg px-3 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
        aria-expanded={showBody}
      >
        {mobileSheet ? "Close" : collapsed ? "Show" : "Hide"}
      </button>
    </div>
  ) : null;

  const body = showBody ? (
    <div className="war-room-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-4">
      {children}
    </div>
  ) : null;

  const renderPanel = (extraClass = "") => (
    <div className={`floating-panel flex min-h-0 flex-1 flex-col overflow-hidden ${extraClass}`}>
      {header}
      {body}
    </div>
  );

  return (
    <>
      {mobileSheet && mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close panel"
            className="fixed inset-0 z-[44] bg-black/55 md:hidden"
            onClick={onMobileClose}
          />
          <div data-testid={testId ? `${testId}-mobile` : undefined} className={`mobile-sheet md:hidden ${className}`}>
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25" aria-hidden />
            {renderPanel("border-0 bg-transparent shadow-none")}
          </div>
        </>
      ) : null}

      <div
        data-testid={testId}
        className={`pointer-events-auto max-h-[min(72vh,calc(100dvh-11rem))] w-[min(360px,calc(100vw-1.5rem))] flex-col ${
          mobileSheet ? "hidden md:flex" : "flex"
        } ${side === "left" ? "self-start" : "self-start ml-auto"} ${className}`}
      >
        {renderPanel()}
      </div>
    </>
  );
}
