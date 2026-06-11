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
      <div className="floating-panel flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-sky-300/70">
            BER+ · June 12
          </div>
          <div className="truncate text-sm font-semibold text-white max-md:text-xs">
            <span className="max-md:hidden">{BRAND.name} · {BRAND.region.split(" ").slice(-1)[0]}</span>
            <span className="md:hidden">{BRAND.shortName}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {onViewModeChange ? (
            <div className="hidden rounded-full bg-white/8 p-0.5 md:flex">
              <button
                type="button"
                onClick={() => onViewModeChange("geo")}
                className={`min-h-[36px] rounded-full px-2.5 py-1 font-medium touch-manipulation sm:py-0.5 ${
                  viewMode !== "matching"
                    ? "bg-sky-500/30 text-sky-100"
                    : "text-white/55 hover:text-white/75"
                }`}
                data-testid="view-mode-geo"
              >
                Geo map
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("matching")}
                className={`min-h-[36px] rounded-full px-2.5 py-1 font-medium touch-manipulation sm:py-0.5 ${
                  viewMode === "matching"
                    ? "bg-amber-500/30 text-amber-100"
                    : "text-white/55 hover:text-white/75"
                }`}
                data-testid="view-mode-matching"
              >
                Matching map
              </button>
            </div>
          ) : null}
          {onOpenAssetMgmt ? (
            <button
              type="button"
              onClick={onOpenAssetMgmt}
              className={`min-h-[36px] rounded-full px-2.5 py-1 font-medium touch-manipulation sm:py-0.5 ${
                assetMgmtActive
                  ? "bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/40"
                  : "bg-white/8 text-white/70 hover:bg-emerald-500/15 hover:text-emerald-100"
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
              className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-sm font-bold touch-manipulation ${
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
          {sessionLabel || personaLabel ? (
            <button
              type="button"
              onClick={onSwitchUser}
              className={`min-h-[36px] rounded-full px-2.5 py-1 touch-manipulation ${
                personaLabel && personaAccentClass
                  ? `${personaAccentClass} font-semibold ring-1 ring-white/20`
                  : "bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25"
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
          <span className="max-md:hidden">
            <Tag>12–24 mo</Tag>
            <Tag>Pilot-1</Tag>
          </span>
          <Link
            href="https://www.ber-plus.de/"
            className="min-h-[36px] rounded-full bg-sky-400/15 px-2.5 py-1 leading-8 text-sky-100 touch-manipulation hover:bg-sky-400/25 sm:leading-normal sm:py-0.5"
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

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/80">{children}</span>;
}
