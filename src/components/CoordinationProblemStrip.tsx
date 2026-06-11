"use client";

import { PROBLEM_SOLUTION_PAIRS } from "@/lib/guest-personas";

type Props = {
  compact?: boolean;
  personaLabel?: string | null;
};

export function CoordinationProblemStrip({ compact = false, personaLabel }: Props) {
  const pairs = compact ? PROBLEM_SOLUTION_PAIRS.slice(0, 3) : PROBLEM_SOLUTION_PAIRS;

  return (
    <section
      className="rounded-lg border border-amber-500/25 bg-gradient-to-br from-amber-950/35 to-ink-950/40 px-3 py-2.5"
      data-testid="coordination-problem-strip"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/90">
          Problem → solution
        </div>
        {personaLabel ? (
          <div className="text-[10px] font-medium text-sky-200/85">View: {personaLabel}</div>
        ) : null}
      </div>
      {!compact ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/60">
          Visibility before matching — ecosystem coordination for the Flughafenregion, not a command centre.
        </p>
      ) : null}
      <ul className={`mt-2 space-y-1.5 ${compact ? "" : "sm:grid sm:grid-cols-1 sm:gap-2 sm:space-y-0"}`}>
        {pairs.map((pair) => (
          <li
            key={pair.problem}
            className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5 text-[11px] leading-snug"
          >
            <span className="font-medium text-amber-100/95">{pair.problem}</span>
            <span className="text-white/35"> → </span>
            <span className="text-sky-100/90">{pair.solution}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
