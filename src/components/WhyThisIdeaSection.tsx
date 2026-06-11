"use client";

import { UNIVERSAL_CORRIDOR_PAINS } from "@/data/problem-cameo";

export function WhyThisIdeaSection({ compact }: { compact?: boolean }) {
  return (
    <section
      className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-ink-950/50 px-3 py-3"
      data-testid="why-this-idea"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/95">
        Why this idea?
      </div>
      {!compact ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/60">
          Before any platform — four pains every stakeholder recognises in the Flughafenregion corridor.
        </p>
      ) : null}
      <ul className={`mt-2 grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        {UNIVERSAL_CORRIDOR_PAINS.map((pain) => (
          <li
            key={pain.id}
            className="rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] leading-snug"
          >
            <div className="font-semibold text-amber-100/95">{pain.title}</div>
            <div className="mt-0.5 text-white/55">{pain.body}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
