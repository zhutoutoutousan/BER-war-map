"use client";

import { PHASES, phaseForDate } from "@/data/programme";
import { useProgramme } from "@/context/ProgrammeContext";

const PHASE_ACCENT: Record<string, string> = {
  I: "#10b981",
  II: "#38bdf8",
  III: "#a78bfa"
};

export function ProgrammePhaseBanner() {
  const { focusDate, hydrated } = useProgramme();
  if (!hydrated) return null;

  const phaseId = phaseForDate(focusDate);
  const phase = PHASES.find((p) => p.id === phaseId)!;
  const accent = PHASE_ACCENT[phaseId];

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[3.25rem] z-[5] max-w-[min(100vw-2rem,28rem)] -translate-x-1/2 px-2 sm:top-[5rem]"
      data-testid="programme-phase-banner"
      aria-live="polite"
    >
      <div
        className="rounded-lg border border-white/10 bg-ink-900/80 px-3 py-1.5 text-center backdrop-blur-md"
        style={{ boxShadow: `0 0 24px ${accent}33` }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
          {phase.label}
        </div>
        <div className="mt-0.5 text-[11px] text-white/60">{phase.summary}</div>
      </div>
    </div>
  );
}
