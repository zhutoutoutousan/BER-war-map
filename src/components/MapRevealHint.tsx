"use client";

import { createPortal } from "react-dom";

type Props = {
  message: string;
  onReopenPanel?: () => void;
  reopenLabel?: string;
};

export function MapRevealHint({ message, onReopenPanel, reopenLabel = "Back to panel" }: Props) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-x-3 z-[48] flex items-center justify-between gap-2 rounded-xl border border-sky-400/35 bg-ink-900/95 px-3 py-2.5 shadow-lg backdrop-blur-md md:hidden"
      style={{ bottom: "calc(3.85rem + env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
      data-testid="map-reveal-hint"
    >
      <p className="min-w-0 flex-1 text-xs font-medium text-sky-100">{message}</p>
      {onReopenPanel ? (
        <button
          type="button"
          onClick={onReopenPanel}
          className="shrink-0 rounded-lg bg-sky-500/25 px-2.5 py-1.5 text-[11px] font-medium text-sky-100 touch-manipulation hover:bg-sky-500/35"
        >
          {reopenLabel}
        </button>
      ) : null}
    </div>,
    document.body
  );
}
