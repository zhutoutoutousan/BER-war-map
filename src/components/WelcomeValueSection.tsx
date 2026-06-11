"use client";

import { GENIUS_IDEA, STAKEHOLDER_VALUES, VALUE_OUTCOME_LABELS, type ValueOutcome } from "@/data/value-by-stakeholder";

const OUTCOME_ORDER: ValueOutcome[] = [
  "faster_matching",
  "visibility",
  "inquiries",
  "collaboration",
  "regional_identity"
];

export function WelcomeValueSection() {
  return (
    <section
      className="rounded-lg border border-sky-500/30 bg-gradient-to-br from-sky-950/35 to-ink-950/45 px-3 py-3"
      data-testid="welcome-value"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-200/95">
        What value does this create?
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/60">
        A neutral BER+ surface — not a broker, not cadastral GIS. Faster matching, visible assets,
        captured inquiries, one Flughafenregion story.
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        {OUTCOME_ORDER.map((o) => (
          <span
            key={o}
            className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] text-white/50"
          >
            {VALUE_OUTCOME_LABELS[o]}
          </span>
        ))}
      </div>

      <ul className="mt-2.5 grid gap-1 sm:grid-cols-2">
        {STAKEHOLDER_VALUES.map((s) => (
          <li
            key={s.id}
            className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5 text-[10px]"
            data-testid={`welcome-value-${s.id}`}
          >
            <span className="font-semibold text-white/85">{s.label}</span>
            <span className="text-white/45"> — </span>
            <span className="text-white/55">{s.headline}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 rounded-md border border-amber-500/30 bg-amber-950/25 px-2.5 py-2">
        <div className="text-[9px] font-bold uppercase tracking-wide text-amber-200/90">
          Big idea · {GENIUS_IDEA.title}
        </div>
        <p className="mt-0.5 text-[10px] leading-snug text-white/65">{GENIUS_IDEA.pitch}</p>
      </div>

      <p className="mt-2 text-[10px] text-white/40">
        After you pick a role: a short scenario, then a live demo walkthrough — company, investor, or
        municipality path on the map.
      </p>
    </section>
  );
}
