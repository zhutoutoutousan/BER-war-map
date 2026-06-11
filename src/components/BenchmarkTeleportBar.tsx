"use client";

import type { ReactNode } from "react";
import { BENCHMARK_CATEGORY_COLORS, getBenchmarkById } from "@/data/benchmarks";
import {
  getMapRegion,
  nextTeleportSite,
  TELEPORT_SITES,
  type MapRegionId
} from "@/lib/map-regions";

type Props = {
  activeId: MapRegionId;
  compareId?: MapRegionId;
  splitCompare: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTeleport: (id: MapRegionId) => void;
  onCompareRegion: (id: MapRegionId) => void;
  onToggleSplit: () => void;
};

export function BenchmarkTeleportBar({
  activeId,
  compareId,
  splitCompare,
  open = true,
  onOpenChange,
  onTeleport,
  onCompareRegion,
  onToggleSplit
}: Props) {
  const region = getMapRegion(activeId);
  const compareRegion = compareId ? getMapRegion(compareId) : null;

  const cycle = (target: "active" | "compare", dir: 1 | -1) => {
    const current = target === "compare" && compareId ? compareId : activeId;
    const next = nextTeleportSite(current, dir);
    if (target === "compare" && splitCompare) onCompareRegion(next);
    else onTeleport(next);
  };

  const splitToggle = (
    <button
      type="button"
      onClick={onToggleSplit}
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium touch-manipulation ${
        splitCompare
          ? "bg-violet-500/35 text-violet-100 ring-1 ring-violet-400/40"
          : "bg-white/8 text-white/60 hover:bg-white/12"
      }`}
      data-testid="toggle-split-compare"
    >
      {splitCompare ? "Exit split" : "Split compare"}
    </button>
  );

  if (!open) {
    return (
      <div
        className="floating-panel pointer-events-auto flex max-w-[min(100%,720px)] items-center gap-2 px-3 py-2 text-[11px]"
        data-testid="benchmark-teleport-bar"
      >
        <span className="shrink-0 font-semibold uppercase tracking-wider text-violet-200/90">
          {splitCompare ? "Split compare" : "Site teleport"}
        </span>
        <span className="min-w-0 truncate text-white/50">
          {splitCompare
            ? compareRegion?.shortLabel ?? "Benchmark"
            : region.shortLabel}
        </span>
        <button
          type="button"
          onClick={() => onOpenChange?.(true)}
          className="ml-auto shrink-0 text-white/45 hover:text-white/75 touch-manipulation"
          data-testid="expand-teleport-bar"
          aria-expanded={false}
        >
          Show
        </button>
        {splitToggle}
      </div>
    );
  }

  return (
    <div
      className="floating-panel pointer-events-auto flex max-w-[min(100%,720px)] flex-col gap-2 px-2 py-2"
      data-testid="benchmark-teleport-bar"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">
          {splitCompare ? "Split compare" : "Site teleport"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="rounded-full px-2.5 py-1 text-[10px] font-medium text-white/55 hover:bg-white/10 hover:text-white/80 touch-manipulation"
            data-testid="collapse-teleport-bar"
            aria-expanded
          >
            Hide
          </button>
          {splitToggle}
        </div>
      </div>

      {splitCompare ? (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <SiteColumn
            title="BER+ corridor"
            regionLabel={getMapRegion("ber-corridor").label}
            locked
          />
          <SiteColumn
            title="Benchmark"
            regionLabel={compareRegion?.label ?? "Pick site"}
            onPrev={() => cycle("compare", -1)}
            onNext={() => cycle("compare", 1)}
          >
            <div className="mt-1 flex flex-wrap gap-1">
              {TELEPORT_SITES.filter((s) => s.id !== "ber-corridor").map((s) => (
                <Chip
                  key={s.id}
                  active={compareId === s.id}
                  color={BENCHMARK_CATEGORY_COLORS[getBenchmarkById(s.id)?.category ?? "airport-region"]}
                  label={s.shortLabel}
                  onClick={() => onCompareRegion(s.id)}
                />
              ))}
            </div>
          </SiteColumn>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <ArrowBtn label="Previous site" onClick={() => cycle("active", -1)} dir="left" />
          <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-1">
            {TELEPORT_SITES.map((s) => {
              const cat = getBenchmarkById(s.id)?.category ?? "airport-region";
              const color =
                s.id === "ber-corridor" ? "#38bdf8" : BENCHMARK_CATEGORY_COLORS[cat];
              return (
                <Chip
                  key={s.id}
                  active={activeId === s.id || (activeId === "ber-osm-prototype" && s.id === "ber-corridor")}
                  color={color}
                  label={s.shortLabel}
                  onClick={() => onTeleport(s.id)}
                />
              );
            })}
          </div>
          <ArrowBtn label="Next site" onClick={() => cycle("active", 1)} dir="right" />
        </div>
      )}

      <p className="text-[9px] leading-relaxed text-white/40">
        {splitCompare
          ? "Left: locked BER+ corridor · Right: locked benchmark slice · pan/zoom constrained per site"
          : `Locked view · ${region.label} · use arrows to teleport`}
      </p>
    </div>
  );
}

function SiteColumn({
  title,
  regionLabel,
  locked,
  onPrev,
  onNext,
  children
}: {
  title: string;
  regionLabel: string;
  locked?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
      <div className="font-semibold text-white/70">{title}</div>
      <div className="truncate text-white/45">{regionLabel}</div>
      {locked ? (
        <div className="mt-1 text-[9px] text-sky-300/70">Fixed · Schönefeld bbox</div>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          {onPrev ? <ArrowBtn label="Prev" onClick={onPrev} dir="left" small /> : null}
          {onNext ? <ArrowBtn label="Next" onClick={onNext} dir="right" small /> : null}
        </div>
      )}
      {children}
    </div>
  );
}

function Chip({
  label,
  color,
  active,
  onClick
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[5.5rem] truncate rounded-full px-2 py-0.5 text-[10px] font-medium touch-manipulation ${
        active ? "ring-1 ring-white/30" : "opacity-75 hover:opacity-100"
      }`}
      style={{
        background: active ? `${color}33` : "rgba(255,255,255,0.06)",
        color: active ? "#fff" : "rgba(255,255,255,0.65)"
      }}
    >
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </button>
  );
}

function ArrowBtn({
  label,
  onClick,
  dir,
  small
}: {
  label: string;
  onClick: () => void;
  dir: "left" | "right";
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-violet-500/30 hover:text-violet-100 touch-manipulation ${
        small ? "h-7 w-7 text-sm" : "h-9 w-9 text-base"
      }`}
    >
      {dir === "left" ? "←" : "→"}
    </button>
  );
}
