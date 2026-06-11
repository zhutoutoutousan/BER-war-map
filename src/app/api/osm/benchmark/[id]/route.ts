import { NextResponse } from "next/server";
import { benchmarkOsmBbox, getBenchmarkById } from "@/data/benchmarks";
import { BER_LAND_SITES } from "@/data/ber-land-sites";
import { fetchOsmIntelForBbox, SCHOENEFELD_OSM_BBOX, emptyOsmIntelPayload, type OsmIntelPayload } from "@/lib/osm-schoenefeld";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";
import { buildInfraIconGeoJSON } from "@/lib/osm-infra-icons";

function capOsmPayload(payload: OsmIntelPayload, maxFeatures = 6000): OsmIntelPayload {
  if (payload.geojson.features.length <= maxFeatures) return payload;
  const sorted = [...payload.geojson.features].sort(
    (a, b) =>
      (b.properties as OsmIntelFeatureProperties).berScore -
      (a.properties as OsmIntelFeatureProperties).berScore
  );
  const features = sorted.slice(0, maxFeatures);
  return {
    ...payload,
    geojson: { type: "FeatureCollection", features },
    iconGeojson: buildInfraIconGeoJSON(features)
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_KEY = "__ber_osm_benchmark_cache__";
const TTL_MS = 6 * 60 * 60 * 1000;

const globalCache = globalThis as typeof globalThis & {
  [CACHE_KEY]?: Record<string, { expiresAt: number; payload: Awaited<ReturnType<typeof fetchOsmIntelForBbox>> }>;
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const benchmark = getBenchmarkById(id);
  if (!benchmark) {
    return NextResponse.json({ error: "Unknown benchmark" }, { status: 404 });
  }

  if (!globalCache[CACHE_KEY]) globalCache[CACHE_KEY] = {};
  const cached = globalCache[CACHE_KEY][id];
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.payload, { headers: { "cache-control": "public, max-age=1800" } });
  }

  try {
    const isBer = id === "ber-osm-prototype";
    const bbox = isBer ? SCHOENEFELD_OSM_BBOX : benchmarkOsmBbox(benchmark);
    const payload = capOsmPayload(
      await fetchOsmIntelForBbox(bbox, benchmark.name, {
        curatedSites: isBer ? BER_LAND_SITES : [],
        timeoutSec: isBer ? 120 : 100
      })
    );
    globalCache[CACHE_KEY][id] = { expiresAt: Date.now() + TTL_MS, payload };
    return NextResponse.json(payload, { headers: { "cache-control": "public, max-age=1800" } });
  } catch (e) {
    if (cached) {
      return NextResponse.json(cached.payload, {
        headers: { "cache-control": "public, max-age=300", "x-ber-stale-cache": "1" }
      });
    }
    const bbox = id === "ber-osm-prototype" ? SCHOENEFELD_OSM_BBOX : benchmarkOsmBbox(benchmark);
    const msg = e instanceof Error ? e.message : "OSM fetch failed";
    const empty = emptyOsmIntelPayload(bbox, benchmark.name);
    return NextResponse.json(
      { ...empty, fetchError: msg },
      { status: 200, headers: { "cache-control": "no-store", "x-ber-osm-error": "1" } }
    );
  }
}
