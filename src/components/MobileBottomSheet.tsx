"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  testId?: string;
  children: ReactNode;
};

export function MobileBottomSheet({ open, title, onClose, testId, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[46] touch-none bg-black/55 md:hidden"
        onClick={onClose}
      />
      <div
        data-testid={testId}
        className="mobile-sheet pointer-events-auto z-[47] md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25" aria-hidden />
        <div className="floating-panel flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent shadow-none">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-lg px-3 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
            >
              Close
            </button>
          </div>
          <div className="mobile-sheet-scroll war-room-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 pb-4 touch-pan-y">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
