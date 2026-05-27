import { NextResponse } from "next/server";
import { fetchSchoenefeldOsmIntel } from "@/lib/osm-schoenefeld";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_KEY = "__ber_osm_intel_cache_v8__";
const TTL_MS = 24 * 60 * 60 * 1000;

const globalCache = globalThis as typeof globalThis & {
  [CACHE_KEY]?: { expiresAt: number; payload: Awaited<ReturnType<typeof fetchSchoenefeldOsmIntel>> };
};

export async function GET() {
  const cached = globalCache[CACHE_KEY];
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.payload, {
      headers: { "cache-control": "public, max-age=3600" }
    });
  }

  try {
    const payload = await fetchSchoenefeldOsmIntel();
    globalCache[CACHE_KEY] = { expiresAt: Date.now() + TTL_MS, payload };
    return NextResponse.json(payload, {
      headers: { "cache-control": "public, max-age=3600" }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OSM fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
