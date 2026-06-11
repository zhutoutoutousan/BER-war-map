"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title?: string;
  side?: "left" | "right";
  defaultCollapsed?: boolean;
  /** Controlled expand — use with onOpenChange to open panel from top nav */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  testId?: string;
  children: ReactNode;
};

export function FloatingPanel({
  title,
  side = "left",
  defaultCollapsed = false,
  open: openProp,
  onOpenChange,
  className = "",
  testId,
  children
}: Props) {
  const [collapsedInternal, setCollapsedInternal] = useState(defaultCollapsed);
  const controlled = openProp !== undefined;
  const collapsed = controlled ? !openProp : collapsedInternal;

  const setCollapsed = (next: boolean) => {
    if (controlled) onOpenChange?.(!next);
    else setCollapsedInternal(next);
  };
  const showBody = !collapsed;

  const header = title ? (
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</span>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="min-h-[44px] min-w-[44px] rounded-lg px-3 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
        aria-expanded={showBody}
      >
        {collapsed ? "Show" : "Hide"}
      </button>
    </div>
  ) : null;

  const body = showBody ? (
    <div className="war-room-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 pb-4">
      {children}
    </div>
  ) : null;

  return (
    <div
      data-testid={testId}
      className={`pointer-events-auto hidden max-h-[min(72vh,calc(100dvh-11rem))] w-[min(360px,calc(100vw-1.5rem))] flex-col md:flex ${
        side === "left" ? "self-start" : "self-start ml-auto"
      } ${className}`}
    >
      <div className="floating-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        {header}
        {body}
      </div>
    </div>
  );
}
