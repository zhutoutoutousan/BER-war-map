import { NextResponse } from "next/server";
import { FEED_SOURCES } from "@/lib/feeds";
import { getIntelligenceAggregate } from "@/lib/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** @deprecated Use /api/intelligence */
export async function GET() {
  const data = await getIntelligenceAggregate(FEED_SOURCES);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    ttlSeconds: 600,
    sources: FEED_SOURCES,
    items: data.items,
    errors: data.errors,
    stats: data.stats
  });
}

