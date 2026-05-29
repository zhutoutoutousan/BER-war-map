import Link from "next/link";

export function CorridorHeader({
  compact = false,
  sessionLabel,
  onSwitchUser,
  viewMode,
  onViewModeChange
}: {
  compact?: boolean;
  sessionLabel?: string | null;
  onSwitchUser?: () => void;
  viewMode?: "geo" | "matching";
  onViewModeChange?: (mode: "geo" | "matching") => void;
}) {
  if (compact) {
    return (
      <div className="floating-panel flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-sky-300/70">
            BER+ · June 12
          </div>
          <div className="truncate text-sm font-semibold text-white max-md:text-xs">
            <span className="max-md:hidden">Match · visibility · intelligence — Flughafenregion</span>
            <span className="md:hidden">Corridor war room</span>
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
          {sessionLabel ? (
            <button
              type="button"
              onClick={onSwitchUser}
              className="min-h-[36px] rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-100 touch-manipulation hover:bg-emerald-400/25"
              data-testid="session-switch-user"
              title="Switch guest / Mitglied"
            >
              <span className="max-md:hidden">
                {sessionLabel === "Guest" ? "Guest" : `Signed in · ${sessionLabel}`}
              </span>
              <span className="md:hidden">{sessionLabel === "Guest" ? "Guest" : sessionLabel}</span>
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
        <div className="text-xs tracking-wide text-white/60">BER+ Resilience Infrastructure Hub</div>
        <div className="text-lg font-semibold text-white">From Pilot-1 to a Scalable EWF-as-a-Service Platform</div>
        <div className="text-sm text-white/70">Corridor briefing — BER+ | 10 min • 21 April 2026</div>
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
