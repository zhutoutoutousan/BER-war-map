"use client";

import type { CameoPersona, CameoVisual } from "@/data/problem-cameo";
import type { GuestPersona } from "@/lib/guest-personas";
import { GUEST_PERSONAS } from "@/lib/guest-personas";

const MEMBER_ACCENT = {
  border: "border-rose-400/40",
  glow: "from-rose-950/80 via-ink-950/90 to-black/95",
  chip: "border-rose-400/35 bg-rose-950/55 text-rose-100/90",
  questBg: "bg-rose-950/40",
  quest: "text-rose-50/95",
  stat: "text-rose-300/85",
  mark: "border-rose-400/40 text-rose-200/70"
};

function accentFor(persona: CameoPersona) {
  if (persona === "member") return MEMBER_ACCENT;
  const g = GUEST_PERSONAS[persona as GuestPersona];
  if (persona === "company") {
    return {
      border: g.accent.border,
      glow: "from-emerald-950/80 via-ink-950/90 to-black/95",
      chip: "border-emerald-400/35 bg-emerald-950/55 text-emerald-100/90",
      questBg: "bg-emerald-950/35",
      quest: "text-emerald-50/95",
      stat: "text-emerald-300/85",
      mark: "border-emerald-400/40 text-emerald-200/70"
    };
  }
  if (persona === "investor") {
    return {
      border: g.accent.border,
      glow: "from-violet-950/80 via-ink-950/90 to-black/95",
      chip: "border-violet-400/35 bg-violet-950/55 text-violet-100/90",
      questBg: "bg-violet-950/35",
      quest: "text-violet-50/95",
      stat: "text-violet-300/85",
      mark: "border-violet-400/40 text-violet-200/70"
    };
  }
  if (persona === "municipality") {
    return {
      border: g.accent.border,
      glow: "from-amber-950/80 via-ink-950/90 to-black/95",
      chip: "border-amber-400/35 bg-amber-950/55 text-amber-100/90",
      questBg: "bg-amber-950/35",
      quest: "text-amber-50/95",
      stat: "text-amber-300/85",
      mark: "border-amber-400/40 text-amber-200/70"
    };
  }
  return {
    border: g.accent.border,
    glow: "from-sky-950/80 via-ink-950/90 to-black/95",
    chip: "border-sky-400/35 bg-sky-950/55 text-sky-100/90",
    questBg: "bg-sky-950/35",
    quest: "text-sky-50/95",
    stat: "text-sky-300/85",
    mark: "border-sky-400/40 text-sky-200/70"
  };
}

export function CameoTitleVisual({
  persona,
  visual
}: {
  persona: CameoPersona;
  visual: CameoVisual;
}) {
  const accent = accentFor(persona);

  return (
    <div
      className={`cameo-vignette mx-auto mt-6 max-w-md overflow-hidden rounded-xl border ${accent.border} bg-gradient-to-b ${accent.glow} shadow-inner`}
      data-testid="cameo-title-visual"
    >
      <div className={`border-b border-white/10 px-3 py-2.5 text-center ${accent.questBg}`}>
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">The ask</div>
        <p className={`mt-1 text-[13px] font-semibold leading-snug ${accent.quest}`}>{visual.quest}</p>
      </div>

      <div className="relative px-3 py-3">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
          aria-hidden
        />

        <div className="relative space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            {visual.fragments.slice(0, 2).map((frag, i) => (
              <FragmentChip key={frag.id} frag={frag} accent={accent.chip} delay={i * 0.35} />
            ))}
          </div>

          <div className="flex justify-center py-0.5" aria-hidden>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-dashed bg-black/55 text-base font-light ${accent.mark}`}
            >
              ?
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {visual.fragments.slice(2, 4).map((frag, i) => (
              <FragmentChip key={frag.id} frag={frag} accent={accent.chip} delay={(i + 2) * 0.35} />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`border-t border-white/10 bg-black/40 px-3 py-2 text-center text-[10px] font-medium tracking-wide ${accent.stat}`}
      >
        {visual.stat}
      </div>
    </div>
  );
}

function FragmentChip({
  frag,
  accent,
  delay
}: {
  frag: { id: string; label: string; short: string };
  accent: string;
  delay: number;
}) {
  return (
    <div
      className={`rounded-md border px-2.5 py-2 backdrop-blur-sm ${accent} animate-[cameo-float_4s_ease-in-out_infinite]`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-[10px] font-semibold leading-tight">{frag.label}</div>
      <div className="mt-0.5 text-[9px] opacity-70">{frag.short}</div>
    </div>
  );
}
