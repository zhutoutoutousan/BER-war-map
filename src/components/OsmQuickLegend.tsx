"use client";

import { OSM_QUICK_LEGEND, type OsmLegendItem } from "@/lib/osm-map-legend";

type Props = {
  compact?: boolean;
  className?: string;
};

export function OsmQuickLegend({ compact, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 ${className}`}
      aria-label="OSM map legend"
    >
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
        Quick legend
      </div>
      <ul className={`grid gap-1.5 ${compact ? "grid-cols-2" : "grid-cols-1"}`}>
        {OSM_QUICK_LEGEND.map((item) => (
          <LegendRow key={`${item.kind}-${item.label}`} item={item} />
        ))}
      </ul>
    </div>
  );
}

function LegendRow({ item }: { item: OsmLegendItem }) {
  return (
    <li className="flex items-center gap-2 text-[10px] text-white/75">
      <LegendSwatch item={item} />
      <span>{item.label}</span>
    </li>
  );
}

function LegendSwatch({ item }: { item: OsmLegendItem }) {
  if (item.kind === "polygon") {
    return (
      <span
        className="h-3 w-5 shrink-0 rounded-sm border border-white/20"
        style={{ backgroundColor: `${item.color}66` }}
      />
    );
  }
  if (item.kind === "line") {
    return (
      <span className="flex h-3 w-5 shrink-0 items-center">
        <span
          className="h-0.5 w-full rounded-full"
          style={{
            backgroundColor: item.color,
            ...(item.dash
              ? {
                  backgroundImage: `repeating-linear-gradient(90deg, ${item.color} 0 4px, transparent 4px 7px)`
                }
              : {})
          }}
        />
      </span>
    );
  }
  if (item.kind === "icon") {
    return (
      <span className="w-5 shrink-0 text-center text-sm leading-none" style={{ color: item.color }}>
        {item.glyph}
      </span>
    );
  }
  if (item.kind === "member") {
    return (
      <span
        className="h-3 w-5 shrink-0 rounded-sm border border-dashed"
        style={{ borderColor: item.color, backgroundColor: `${item.color}33` }}
      />
    );
  }
  if (item.kind === "memberZone") {
    return (
      <span
        className="h-3 w-5 shrink-0 rounded-full border-2 border-dashed"
        style={{ borderColor: item.color, backgroundColor: `${item.color}22` }}
      />
    );
  }
  if (item.kind === "corridor") {
    return (
      <span className="flex h-3 w-5 shrink-0 flex-col justify-center gap-0.5">
        <span className="h-1 w-full rounded-full opacity-40" style={{ backgroundColor: item.color }} />
        <span className="h-0.5 w-full rounded-full" style={{ backgroundColor: item.color }} />
      </span>
    );
  }
  return (
    <span
      className="h-3 w-5 shrink-0 rounded-sm border border-dashed border-emerald-400/60"
      style={{ backgroundColor: "rgba(52, 211, 153, 0.25)" }}
    />
  );
}
