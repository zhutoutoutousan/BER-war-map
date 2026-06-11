"use client";

import type { LeftTab } from "@/components/BerPlusValuePanel";
import { BRAND } from "@/lib/brand";
import { GUEST_PERSONAS, type GuestPersona } from "@/lib/guest-personas";
import { TAB_LABELS } from "@/components/PersonaTabBar";

type Props = {
  persona: GuestPersona;
  pulse?: boolean;
  activeTab: LeftTab;
  onGoToTab: (tab: LeftTab) => void;
  onSwitchUser: () => void;
  onOpenMatching?: () => void;
};

export function PersonaViewBanner({
  persona,
  pulse = false,
  activeTab,
  onGoToTab,
  onSwitchUser,
  onOpenMatching
}: Props) {
  const config = GUEST_PERSONAS[persona];
  const { accent } = config;

  return (
    <div
      className={`mb-3 rounded-xl border-2 bg-gradient-to-br px-3 py-2.5 shadow-lg transition-all duration-500 ${accent.border} ${accent.bg} ${
        pulse ? "persona-pulse ring-2 ring-white/30" : ""
      }`}
      data-testid="persona-view-banner"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}>
              {BRAND.personaBadge}
            </span>
            {pulse ? (
              <span className="animate-pulse text-[10px] font-medium text-white/70">Just updated</span>
            ) : null}
          </div>
          <h3 className={`mt-1.5 text-sm font-semibold leading-snug ${accent.text}`}>{config.label}</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">{config.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onSwitchUser}
          className="shrink-0 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-[10px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
          data-testid="persona-change-role"
        >
          Change
        </button>
      </div>

      <div className="mt-2.5 mobile-scroll-x -mx-1 flex gap-1.5 px-1 pb-0.5">
        {config.highlightTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onGoToTab(tab)}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-medium ring-1 transition touch-manipulation min-h-[40px] ${
              activeTab === tab
                ? `${accent.chip} ring-2`
                : "bg-black/25 text-white/55 ring-white/10 hover:bg-white/10 hover:text-white/80"
            }`}
            data-testid={`persona-chip-${tab}`}
          >
            {activeTab === tab ? "● " : ""}
            {TAB_LABELS[tab]}
          </button>
        ))}
        {onOpenMatching ? (
          <button
            type="button"
            onClick={onOpenMatching}
            className="shrink-0 rounded-full bg-amber-500/15 px-3 py-2 text-[10px] font-medium text-amber-100 ring-1 ring-amber-400/30 hover:bg-amber-500/25 min-h-[40px] touch-manipulation"
            data-testid="persona-chip-matching"
          >
            Matching map
          </button>
        ) : null}
      </div>
    </div>
  );
}
