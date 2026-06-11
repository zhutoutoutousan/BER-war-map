import {
  BENCHMARK_CATEGORIES,
  BENCHMARK_CATEGORY_COLORS,
  BENCHMARKS,
  getBenchmarkById,
  type Benchmark,
  type BenchmarkCategory
} from "@/data/benchmarks";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function benchmarkPopupHtml(id: string): string {
  const b = getBenchmarkById(id);
  if (!b) return "";
  const cat = BENCHMARK_CATEGORIES[b.category];
  const color = BENCHMARK_CATEGORY_COLORS[b.category];
  const stakeholderLine =
    b.stakeholders?.length ?
      `<div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.55)">${b.stakeholders.length} stakeholders · ${b.matching?.length ?? 0} matching patterns</div>`
    : "";
  const programmeLine = b.programme
    ? `<div style="margin-top:4px;font-size:10px;color:rgba(255,255,255,0.5)">${escapeHtml(b.programme.phaseLabel)} · ${escapeHtml(b.programme.horizon)}</div>`
    : "";
  return `<div style="max-width:240px;font-family:system-ui,sans-serif">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${color}">${escapeHtml(cat)}</div>
    <div style="margin-top:4px;font-size:13px;font-weight:600;color:#fff">${escapeHtml(b.name)}</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.5)">${escapeHtml(b.region)}</div>
    ${programmeLine}
    <p style="margin:8px 0 0;font-size:11px;line-height:1.45;color:rgba(255,255,255,0.72)">${escapeHtml(b.whatTheyDo.slice(0, 160))}${b.whatTheyDo.length > 160 ? "…" : ""}</p>
    ${stakeholderLine}
    <a href="${escapeHtml(b.sourceUrl)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:10px;color:#7dd3fc">Source ↗</a>
  </div>`;
}

export function benchmarksToGeoJSON(
  items: Benchmark[] = BENCHMARKS,
  categoryFilter: BenchmarkCategory | "all" = "all"
): GeoJSON.FeatureCollection {
  const list =
    categoryFilter === "all" ? items : items.filter((b) => b.category === categoryFilter);

  return {
    type: "FeatureCollection",
    features: list.map((b) => ({
      type: "Feature",
      id: b.id,
      properties: {
        id: b.id,
        name: b.name,
        region: b.region,
        category: b.category,
        color: BENCHMARK_CATEGORY_COLORS[b.category],
        isPrototype: b.id === "ber-osm-prototype",
        stakeholderCount: b.stakeholders?.length ?? 0,
        matchingCount: b.matching?.length ?? 0,
        horizon: b.programme?.horizon ?? ""
      },
      geometry: {
        type: "Point",
        coordinates: b.coordinates
      }
    }))
  };
}

/** Dashed comparison arcs from each benchmark toward BER+ prototype */
export function benchmarkComparisonLinesGeoJSON(
  items: Benchmark[] = BENCHMARKS
): GeoJSON.FeatureCollection {
  const ber = getBenchmarkById("ber-osm-prototype");
  if (!ber) return { type: "FeatureCollection", features: [] };

  const features: GeoJSON.Feature[] = items
    .filter((b) => b.id !== ber.id)
    .map((b) => ({
      type: "Feature",
      id: `line-${b.id}`,
      properties: {
        fromId: b.id,
        toId: ber.id,
        category: b.category,
        color: BENCHMARK_CATEGORY_COLORS[b.category]
      },
      geometry: {
        type: "LineString",
        coordinates: [b.coordinates, ber.coordinates]
      }
    }));

  return { type: "FeatureCollection", features };
}

export const GLOBAL_MAP_DEFAULT = {
  center: [18, 28] as [number, number],
  zoom: 1.35
};

export const BER_BENCHMARK_ID = "ber-osm-prototype";

export function singleBenchmarkGeoJSON(benchmarkId: string): GeoJSON.FeatureCollection {
  const b = getBenchmarkById(benchmarkId);
  if (!b) return { type: "FeatureCollection", features: [] };
  return benchmarksToGeoJSON([b]);
}
