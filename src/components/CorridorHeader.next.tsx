import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function CorridorHeader({
  compact = false,
  sessionLabel,
  personaLabel,
  personaAccentClass,
  onSwitchUser,
  viewMode,
  onViewModeChange,
  assetMgmtActive,
  onOpenAssetMgmt,
  assetMgmtBadge,
  onOpenGuidedTour,
  guidedTourActive
}: {
  compact?: boolean;
  sessionLabel?: string | null;
  personaLabel?: string | null;
  personaAccentClass?: string;
  onSwitchUser?: () => void;
  viewMode?: "geo" | "matching";
  onViewModeChange?: (mode: "geo" | "matching") => void;
  assetMgmtActive?: boolean;
  onOpenAssetMgmt?: () => void;
  assetMgmtBadge?: string;
  onOpenGuidedTour?: () => void;
  guidedTourActive?: boolean;
}) {
  if (compact) {
    return (
      <div className="floating-panel mobile-safe-x flex flex-col gap-2 px-2 py-2 sm:px-3 sm:py-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-sky-300/70">
              BER+ · June 12
            </div>
            <div className="truncate text-sm font-semibold text-white max-md:text-xs">
              <span className="max-md:hidden">{BRAND.name} · {BRAND.region.split(" ").slice(-1)[0]}</span>
              <span className="md:hidden">{BRAND.shortName}</span>
            </div>
          </div>
          {sessionLabel || personaLabel ? (
            <button
              type="button"
              onClick={onSwitchUser}
              className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] touch-manipulation sm:min-h-[44px] ${
                personaLabel && personaAccentClass
                  ? `${personaAccentClass} min-h-[40px] font-semibold ring-1 ring-white/20`
                  : "min-h-[40px] bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25"
              }`}
              data-testid="session-switch-user"
              title="Switch guest / Mitglied"
            >
              <span className="max-md:hidden">
                {personaLabel
                  ? `${personaLabel} view`
                  : sessionLabel === "Guest"
                    ? "Guest"
                    : `Signed in · ${sessionLabel}`}
              </span>
              <span className="md:hidden">
                {personaLabel ?? (sessionLabel === "Guest" ? "Guest" : sessionLabel)}
              </span>
            </button>
          ) : null}
        </div>

        <div className="mobile-scroll-x -mx-1 flex items-center gap-1.5 px-1 pb-0.5 text-[10px]">
          {onViewModeChange ? (
            <>
              <div className="flex shrink-0 rounded-full bg-white/8 p-0.5 md:hidden">
                <HeaderPill
                  active={viewMode !== "matching"}
                  onClick={() => onViewModeChange("geo")}
                  testId="view-mode-geo"
                  activeClass="bg-sky-500/30 text-sky-100"
                >
                  Map
                </HeaderPill>
                <HeaderPill
                  active={viewMode === "matching"}
                  onClick={() => onViewModeChange("matching")}
                  testId="view-mode-matching"
                  activeClass="bg-amber-500/30 text-amber-100"
                >
                  Match
                </HeaderPill>
              </div>
              <div className="hidden shrink-0 rounded-full bg-white/8 p-0.5 md:flex">
                <HeaderPill
                  active={viewMode !== "matching"}
                  onClick={() => onViewModeChange("geo")}
                  testId="view-mode-geo"
                  activeClass="bg-sky-500/30 text-sky-100"
                >
                  Geo map
                </HeaderPill>
                <HeaderPill
                  active={viewMode === "matching"}
                  onClick={() => onViewModeChange("matching")}
                  testId="view-mode-matching"
                  activeClass="bg-amber-500/30 text-amber-100"
                >
                  Matching map
                </HeaderPill>
              </div>
            </>
          ) : null}
          {onOpenAssetMgmt ? (
            <button
              type="button"
              onClick={onOpenAssetMgmt}
              className={`shrink-0 rounded-full px-2.5 py-2 font-medium touch-manipulation ${
                assetMgmtActive
                  ? "min-h-[40px] bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/40"
                  : "min-h-[40px] bg-white/8 text-white/70 hover:bg-emerald-500/15 hover:text-emerald-100"
              }`}
              data-testid="top-nav-asset-mgmt"
              title="Member co-inventory · step 2"
            >
              <span className="max-md:hidden">Asset mgmt</span>
              <span className="md:hidden">Assets</span>
              {assetMgmtBadge ? (
                <span className="ml-1 font-mono text-[9px] opacity-80">{assetMgmtBadge}</span>
              ) : null}
            </button>
          ) : null}
          {onOpenGuidedTour ? (
            <button
              type="button"
              onClick={onOpenGuidedTour}
              className={`flex shrink-0 min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-sm font-bold touch-manipulation sm:min-h-[44px] sm:min-w-[44px] ${
                guidedTourActive
                  ? "animate-pulse bg-sky-500/35 text-sky-100 ring-2 ring-sky-400/55"
                  : "bg-white/8 text-white/75 hover:bg-sky-500/15 hover:text-sky-100"
              }`}
              data-testid="top-nav-guided-tour"
              title="Live walkthrough · guided tour"
              aria-label="Open guided tour"
            >
              ?
            </button>
          ) : null}
          <span className="hidden shrink-0 gap-1 sm:flex">
            <Tag>12–24 mo</Tag>
            <Tag>Pilot-1</Tag>
          </span>
          <Link
            href="https://www.ber-plus.de/"
            className="hidden shrink-0 rounded-full bg-sky-400/15 px-2.5 py-2 text-sky-100 touch-manipulation hover:bg-sky-400/25 sm:inline-flex sm:min-h-[40px] sm:items-center"
            target="_blank"
            rel="noreferrer"
          >
            ber-plus.de
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="text-xs tracking-wide text-white/60">{BRAND.name}</div>
        <div className="text-lg font-semibold text-white">{BRAND.tagline}</div>
        <div className="text-sm text-white/70">{BRAND.subtitle}</div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Tag>Resilience</Tag>
        <Tag>Module 1.0</Tag>
        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">Pilot-1</span>
        <Tag>Scale</Tag>
        <Tag>EWF-as-a-Service</Tag>
        <Link
          href="https://www.ber-plus.de/"
          className="rounded-full bg-sky-400/15 px-3 py-1 text-sky-100 hover:bg-sky-400/20"
          target="_blank"
          rel="noreferrer"
        >
          BER+ site
        </Link>
      </div>
    </div>
  );
}

function HeaderPill({
  active,
  onClick,
  testId,
  activeClass,
  children
}: {
  active: boolean;
  onClick: () => void;
  testId: string;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] rounded-full px-2.5 py-1.5 font-medium touch-manipulation sm:min-h-[44px] ${
        active ? activeClass : "text-white/55 hover:text-white/75"
      }`}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/80">{children}</span>;
}
