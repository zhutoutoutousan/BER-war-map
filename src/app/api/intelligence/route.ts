import { NextResponse } from "next/server";
import { FEED_SOURCES } from "@/lib/feeds";
import { getIntelligenceAggregate } from "@/lib/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getIntelligenceAggregate(FEED_SOURCES);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    ttlSeconds: 600,
    filter: "BER+ corridor topics",
    sourceList: "https://rss.feedspot.com/german_news_rss_feeds/",
    ...data
  });
}
