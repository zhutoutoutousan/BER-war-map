import type { Benchmark } from "@/data/benchmarks";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";
import { centroidOf } from "@/lib/osm-intel-lookup";

export type BenchmarkMatch = {
  id: string;
  stakeholder: string;
  role: string;
  pattern: string;
  osmFeatureId?: string;
  osmTitle?: string;
  center?: [number, number];
  priority: "high" | "medium" | "low";
};

const CATEGORY_WEIGHT: Record<string, number> = {
  aeroway: 20,
  land: 15,
  industry: 12,
  transport: 8,
  power: 6,
  utilities: 4
};

function tokenize(s: string) {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
}

/** Link benchmark stakeholders + matching patterns to nearby OSM intel features */
export function buildBenchmarkMatches(
  benchmark: Benchmark,
  geojson: GeoJSON.FeatureCollection | null | undefined
): BenchmarkMatch[] {
  if (!benchmark.stakeholders?.length || !geojson?.features.length) {
    return (benchmark.matching ?? []).map((m, i) => ({
      id: `pattern-${i}`,
      stakeholder: benchmark.name,
      role: "Platform pattern",
      pattern: m.pattern,
      priority: "medium" as const
    }));
  }

  const matches: BenchmarkMatch[] = [];
  const patterns = benchmark.matching ?? [];

  for (const stakeholder of benchmark.stakeholders) {
    const keys = tokenize(`${stakeholder.name} ${stakeholder.role}`);
    let best: { f: GeoJSON.Feature; score: number } | null = null;

    for (const f of geojson.features) {
      const p = f.properties as OsmIntelFeatureProperties;
      const center = centroidOf(f.geometry);
      if (!center) continue;
      let score = CATEGORY_WEIGHT[p.category] ?? 2;
      const hay = `${p.name} ${p.subcategory} ${p.tagsSummary}`.toLowerCase();
      for (const k of keys) {
        if (hay.includes(k)) score += 10;
      }
      if (p.category === "aeroway" || p.category === "industry" || p.category === "land") score += 4;
      if (!best || score > best.score) best = { f, score };
    }

    const pattern = patterns[matches.length % patterns.length]?.pattern ?? "Regional asset link";
    const props = best?.f.properties as OsmIntelFeatureProperties | undefined;
    const center = best ? centroidOf(best.f.geometry) ?? undefined : undefined;

    matches.push({
      id: `bm-${benchmark.id}-${stakeholder.name}`,
      stakeholder: stakeholder.name,
      role: stakeholder.role,
      pattern,
      osmFeatureId: props?.id,
      osmTitle: props?.name,
      center,
      priority: best && best.score >= 18 ? "high" : best && best.score >= 10 ? "medium" : "low"
    });
  }

  return matches;
}
