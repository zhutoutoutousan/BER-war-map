import { NextResponse } from "next/server";
import { BER_PLUS_MEMBERS_MENU } from "@/data/ber-plus-members-menu";
import { BER_PLUS_CHAIR, MITGLIEDER, mitgliederToGeoJSON } from "@/data/mitglieder";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    source: "https://www.ber-plus.de/",
    menu: BER_PLUS_MEMBERS_MENU,
    note: "Map coordinates are draft corridor placements for visualization.",
    chair: BER_PLUS_CHAIR,
    members: MITGLIEDER,
    geojson: mitgliederToGeoJSON()
  });
}
