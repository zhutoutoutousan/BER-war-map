import { NextResponse } from "next/server";
import { getCctvAggregate } from "@/lib/cctv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getCctvAggregate();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    center: { name: "Schönefeld / BER", coordinates: [13.52, 52.38] },
    ...data
  }, {
    headers: { "cache-control": "public, max-age=300" }
  });
}
