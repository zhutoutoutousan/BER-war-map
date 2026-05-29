/**
 * Live OSM ↔ Mitglied matching from loaded GeoJSON (rule-based, no network).
 */

import { BER_LAND_SITES } from "@/data/ber-land-sites";
import { getMitgliedById } from "@/data/mitglieder";
import { getMemberOsmFeatures, LAND_SITE_MEMBER_IDS } from "@/lib/member-osm-links";
import { centroidOf } from "@/lib/osm-intel-lookup";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";
import { displayNameForOsmFeature } from "@/lib/osm-display-name";
import type { LeftTab } from "@/components/BerPlusValuePanel";

export type LiveMatch = {
  id: string;
  kind: "osm" | "land" | "peer";
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  cta: string;
  tab: LeftTab;
  score: number;
  osmFeatureId?: string;
  landSiteId?: string;
  peerMemberId?: string;
  center?: [number, number];
  matchKinds?: string;
};

function featureCenter(f: GeoJSON.Feature): [number, number] | undefined {
  return centroidOf(f.geometry) ?? undefined;
}

export function scoreOsmFeatureForMember(f: GeoJSON.Feature, memberId: string): number {
  const p = f.properties as OsmIntelFeatureProperties;
  let score = 0;
  const kinds = p.memberMatchKinds ?? "";
  if (p.primaryMemberId === memberId) score += 20;
  if (kinds.includes("keyword")) score += 12;
  if (kinds.includes("land-anchor")) score += 15;
  if (kinds.includes("proximity")) score += 8;
  if (kinds.includes("topic")) score += 6;
  if (p.category === "land" || p.category === "industry") score += 4;
  if (p.category === "power" || p.category === "transport") score += 2;
  return score;
}

/** Build a review-card match for any OSM feature linked to this Mitglied. */
export function liveMatchFromOsmFeature(
  f: GeoJSON.Feature,
  memberId: string
): LiveMatch | null {
  const p = f.properties as OsmIntelFeatureProperties;
  const ids = (p.memberIds ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.includes(memberId)) return null;

  const center = featureCenter(f);
  if (!center) return null;

  const score = scoreOsmFeatureForMember(f, memberId);

  return {
    id: `osm-${p.id}`,
    kind: "osm",
    priority: score >= 20 ? "high" : score >= 10 ? "medium" : "low",
    title: displayNameForOsmFeature(p),
    detail: `${p.category} · ${p.subcategory}${p.areaHa ? ` · ~${p.areaHa} ha` : ""}${
      p.memberMatchKinds ? ` · ${p.memberMatchKinds.split(";")[0]}` : ""
    }`,
    cta: "Highlight on map",
    tab: "junqingchu",
    score,
    osmFeatureId: p.id,
    center,
    matchKinds: p.memberMatchKinds
  };
}

export function buildLiveMatches(
  memberId: string,
  geojson: GeoJSON.FeatureCollection | null | undefined
): LiveMatch[] {
  const member = getMitgliedById(memberId);
  if (!member) return [];

  const matches: LiveMatch[] = [];

  for (const site of BER_LAND_SITES) {
    const linked = LAND_SITE_MEMBER_IDS[site.id] ?? [];
    if (!linked.includes(memberId)) continue;
    matches.push({
      id: `land-${site.id}`,
      kind: "land",
      priority: site.status === "confirmed" ? "high" : "medium",
      title: site.name.split("—")[0].trim(),
      detail: `${site.areaHa} ha · ${site.useCase}`,
      cta: "Fly to land anchor on map",
      tab: "junqingchu",
      score: 90 + site.areaHa / 10,
      landSiteId: site.id,
      center: site.coordinates
    });

    for (const peerId of linked) {
      if (peerId === memberId) continue;
      const peer = getMitgliedById(peerId);
      if (!peer) continue;
      matches.push({
        id: `peer-${peerId}-${site.id}`,
        kind: "peer",
        priority: "medium",
        title: `Peer: ${peer.shortName}`,
        detail: `Shared anchor ${site.name.split("—")[0].trim()} — ${peer.corridorRole}`,
        cta: "Open peer profile on map",
        tab: "members",
        score: 70,
        peerMemberId: peerId,
        landSiteId: site.id,
        center: peer.coordinates
      });
    }
  }

  if (geojson) {
    const features = getMemberOsmFeatures(geojson, memberId);
    const ranked = features
      .map((f) => ({
        f,
        score: scoreOsmFeatureForMember(f, memberId),
        center: featureCenter(f)
      }))
      .filter((x) => x.center)
      .sort((a, b) => b.score - a.score)
      .slice(0, 36);

    for (const { f, score, center } of ranked) {
      const p = f.properties as OsmIntelFeatureProperties;
      matches.push({
        id: `osm-${p.id}`,
        kind: "osm",
        priority: score >= 20 ? "high" : "medium",
        title: displayNameForOsmFeature(p),
        detail: `${p.category} · ${p.subcategory}${p.areaHa ? ` · ~${p.areaHa} ha` : ""}${
          p.memberMatchKinds ? ` · ${p.memberMatchKinds.split(";")[0]}` : ""
        }`,
        cta: "Highlight on map",
        tab: "junqingchu",
        score,
        osmFeatureId: p.id,
        center,
        matchKinds: p.memberMatchKinds
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

export function matchesForGraph(
  memberId: string,
  geojson: GeoJSON.FeatureCollection | null | undefined,
  limit = 8
): LiveMatch[] {
  return buildLiveMatches(memberId, geojson)
    .filter((m) => m.kind === "osm" && m.center)
    .slice(0, limit);
}

export function formatMatchesForAi(memberId: string, matches: LiveMatch[]): string {
  const member = getMitgliedById(memberId);
  if (!member) return "";
  const lines = [
    `Mitglied: ${member.name} (${member.category})`,
    `Corridor role: ${member.corridorRole}`,
    `Top local matches (${matches.length}):`
  ];
  for (const m of matches.slice(0, 10)) {
    lines.push(`- [${m.kind}] ${m.title}: ${m.detail}`);
  }
  return lines.join("\n");
}
