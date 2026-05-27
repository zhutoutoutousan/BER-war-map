import { OSM_INTEL_CATEGORIES } from "@/lib/osm-intel-categories";
import { INFRA_POINT_ICON_DEFS } from "@/lib/osm-infra-icons";

export type OsmLegendItem =
  | { kind: "polygon"; label: string; color: string }
  | { kind: "line"; label: string; color: string; dash?: boolean }
  | { kind: "icon"; label: string; color: string; glyph: string }
  | { kind: "member"; label: string; color: string }
  | { kind: "memberZone"; label: string; color: string }
  | { kind: "corridor"; label: string; color: string }
  | { kind: "anchor"; label: string; color: string };

/** Compact map legend — polygons, corridors (lines), point icons */
export const OSM_QUICK_LEGEND: OsmLegendItem[] = [
  { kind: "corridor", label: "BER+ Corridor", color: "#38bdf8" },
  { kind: "memberZone", label: "Mitglieder zones", color: "#fbbf24" },
  ...OSM_INTEL_CATEGORIES.filter((c) => c.id === "land" || c.id === "industry" || c.id === "aeroway").map(
    (c) => ({ kind: "polygon" as const, label: c.labelEn, color: c.color })
  ),
  { kind: "line", label: "Transport corridors", color: "#a3e635" },
  { kind: "line", label: "Power lines", color: "#f87171" },
  { kind: "line", label: "Utilities", color: "#22d3ee", dash: true },
  ...INFRA_POINT_ICON_DEFS.slice(0, 6).map((d) => ({
    kind: "icon" as const,
    label: d.labelEn,
    color: d.color,
    glyph: d.glyph
  })),
  { kind: "member", label: "Member-linked OSM", color: "#fbbf24" },
  { kind: "anchor", label: "BER+ land anchors", color: "#34d399" }
];
