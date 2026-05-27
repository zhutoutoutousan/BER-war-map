"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title?: string;
  side?: "left" | "right";
  defaultCollapsed?: boolean;
  className?: string;
  children: ReactNode;
};

export function FloatingPanel({
  title,
  side = "left",
  defaultCollapsed = false,
  className = "",
  children
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={`pointer-events-auto flex max-h-[min(72vh,calc(100dvh-11rem))] w-[min(360px,calc(100vw-1.5rem))] flex-col ${
        side === "left" ? "self-start" : "self-start ml-auto"
      } ${className}`}
    >
      <div className="floating-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        {title ? (
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</span>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded px-2 py-0.5 text-xs text-white/50 hover:bg-white/10 hover:text-white/80"
              aria-expanded={!collapsed}
            >
              {collapsed ? "Show" : "Hide"}
            </button>
          </div>
        ) : null}
        {!collapsed ? (
          <div className="war-room-scroll min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
