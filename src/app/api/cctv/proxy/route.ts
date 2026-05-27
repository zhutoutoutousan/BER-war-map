import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "www.verkehr.nrw",
  "verkehr.nrw",
  "verkehr.autobahn.de",
  "imgproxy.windy.com",
  "webcams.windy.com",
  "images-webcams.windy.com",
  "evo-data.rbb-online.de",
  "www.inselhotel-potsdam.de",
  "phenocam.nau.edu"
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { "user-agent": "BER-war-map/0.1" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    });
    if (!res.ok) return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=60"
      }
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
