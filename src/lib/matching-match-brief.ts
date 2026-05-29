/**
 * Rich decision brief for swipe / match review — OSM intel + Mitglied context.
 */

import { getBerLandSiteById } from "@/data/ber-land-sites";
import { CATEGORY_LABELS, getMitgliedById, type Mitglied } from "@/data/mitglieder";
import { CATEGORY_MEMBER_PATHS, MEMBER_PATH_OVERRIDES } from "@/data/ber-plus-coordination";
import { haversineKm } from "@/lib/geo";
import type { LiveMatch } from "@/lib/local-member-matching";
import { LAND_SITE_MEMBER_IDS, MEMBER_OSM_PROFILES } from "@/lib/member-osm-links";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";

export type MatchFact = { label: string; value: string };

export type MatchBrief = {
  match: LiveMatch;
  member: Mitglied;
  /** One-line category path from BER+ coordination */
  coordinationHint: string;
  whyMatch: string[];
  facts: MatchFact[];
  berPlusNote?: string;
  peerContext?: string;
  sharedLand?: string;
};

const KIND_LABELS: Record<string, string> = {
  keyword: "Portfolio / name keyword hit in OSM tags",
  topic: "Thematic overlap with your corridor search topics",
  proximity: "Within proximity radius of your corridor map pin",
  "land-anchor": "Connected via a shared BER+ land anchor"
};

function parseMatchReasons(kinds: string | undefined, memberId: string): string[] {
  if (!kinds) return [];
  const member = getMitgliedById(memberId);
  const out = new Set<string>();

  for (const segment of kinds.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    const who = colon >= 0 ? trimmed.slice(0, colon).trim() : trimmed;
    const how = colon >= 0 ? trimmed.slice(colon + 1) : "";

    const whoLower = who.toLowerCase();
    const isSelf =
      whoLower === memberId ||
      whoLower === member?.shortName.toLowerCase() ||
      whoLower === member?.name.toLowerCase();
    if (!isSelf) continue;

    for (const token of how.split("+")) {
      const label = KIND_LABELS[token.trim()];
      if (label) out.add(label);
    }
  }

  return [...out];
}

function coordinationHintFor(member: Mitglied): string {
  const override = MEMBER_PATH_OVERRIDES[member.id];
  const step = override?.steps?.[0] ?? CATEGORY_MEMBER_PATHS[member.category]?.[0];
  if (!step) return member.corridorRole;
  return `${step.problem} — ${step.youDo}`;
}

function findOsmFeature(
  geojson: GeoJSON.FeatureCollection | null | undefined,
  featureId: string | undefined
): GeoJSON.Feature | undefined {
  if (!geojson || !featureId) return undefined;
  return geojson.features.find((f) => (f.properties as OsmIntelFeatureProperties).id === featureId);
}

export function buildMatchBrief(
  match: LiveMatch,
  memberId: string,
  geojson: GeoJSON.FeatureCollection | null | undefined
): MatchBrief | null {
  const member = getMitgliedById(memberId);
  if (!member) return null;

  const profile = MEMBER_OSM_PROFILES.find((p) => p.id === memberId);
  const whyMatch: string[] = [];
  const facts: MatchFact[] = [
    { label: "Your organisation", value: member.name },
    { label: "Corridor role", value: member.corridorRole },
    { label: "Category", value: CATEGORY_LABELS[member.category] }
  ];

  if (member.tags?.length) {
    facts.push({ label: "Focus tags", value: member.tags.join(" · ") });
  }

  if (profile?.keywords.length) {
    facts.push({
      label: "Matching keywords",
      value: profile.keywords.slice(0, 4).join(" · ")
    });
  }

  let berPlusNote: string | undefined;
  let peerContext: string | undefined;
  let sharedLand: string | undefined;

  if (match.kind === "osm") {
    const f = findOsmFeature(geojson, match.osmFeatureId);
    const p = f?.properties as OsmIntelFeatureProperties | undefined;

    whyMatch.push(...parseMatchReasons(p?.memberMatchKinds ?? match.matchKinds, memberId));

    if (p?.primaryMemberId === memberId) {
      whyMatch.push("Ranked as your primary linked asset in OSM intel");
    }

    if (profile?.topics?.length) {
      whyMatch.push(`Your configured topics: ${profile.topics.slice(0, 5).join(", ")}`);
    }

    if (match.center) {
      const km = haversineKm(member.coordinates, match.center);
      facts.push({ label: "Distance from your pin", value: `${km.toFixed(1)} km` });
      if (profile?.proximityKm && km <= profile.proximityKm) {
        whyMatch.push(`Inside your ${profile.proximityKm} km proximity watch radius`);
      }
    }

    if (p) {
      facts.push({ label: "OSM type", value: `${p.category} / ${p.subcategory}` });
      if (p.areaHa != null) facts.push({ label: "Indicative area", value: `~${p.areaHa} ha` });
      if (p.landOpportunity) facts.push({ label: "Land opportunity", value: p.landOpportunity });
      if (p.landSuitability != null) {
        facts.push({ label: "Suitability (1–5)", value: String(p.landSuitability) });
      }
      if (p.berRelevant) {
        facts.push({ label: "BER+ score", value: `★ ${p.berScore} · corridor-relevant` });
      } else {
        facts.push({ label: "BER+ score", value: `${p.berScore} (local context)` });
      }
      if (p.tagsSummary) facts.push({ label: "OSM tags (sample)", value: p.tagsSummary });
      if (p.memberLabels && p.memberIds.split(",").filter(Boolean).length > 1) {
        facts.push({ label: "Other Mitglieder linked", value: p.memberLabels });
      }
      if (p.landNotes) berPlusNote = p.landNotes;
      facts.push({ label: "OSM ref", value: `${p.osmType}/${p.osmId}` });
    }

    if (!whyMatch.length) {
      whyMatch.push("Rule-based link from OSM intel member matching pipeline");
    }
  }

  if (match.kind === "land" && match.landSiteId) {
    const site = getBerLandSiteById(match.landSiteId);
    if (site) {
      whyMatch.push("You are listed on this BER+ curated land anchor");
      facts.push({ label: "Status", value: site.status });
      facts.push({ label: "Area", value: `${site.areaHa} ha` });
      facts.push({ label: "Use case", value: site.useCase });
      facts.push({ label: "BER+ role", value: site.berPlusRole });
      berPlusNote = site.notes;
      if (site.sources?.length) {
        facts.push({ label: "Sources", value: site.sources.join(" · ") });
      }

      const peers = (LAND_SITE_MEMBER_IDS[site.id] ?? []).filter((id) => id !== memberId);
      if (peers.length) {
        const names = peers.map((id) => getMitgliedById(id)?.shortName ?? id).join(", ");
        facts.push({ label: "Co-located Mitglieder", value: names });
        whyMatch.push(`Shared anchor with ${names} — coordination opportunity`);
      }
    }
  }

  if (match.kind === "peer" && match.peerMemberId) {
    const peer = getMitgliedById(match.peerMemberId);
    if (peer) {
      peerContext = peer.intro;
      whyMatch.push(`Peer Mitglied on the same corridor land anchor`);
      facts.push({ label: "Peer category", value: CATEGORY_LABELS[peer.category] });
      facts.push({ label: "Peer role", value: peer.corridorRole });
      if (peer.tags?.length) facts.push({ label: "Peer focus", value: peer.tags.join(" · ") });

      if (match.landSiteId) {
        const site = getBerLandSiteById(match.landSiteId);
        sharedLand = site?.name.split("—")[0].trim();
        if (site) {
          facts.push({ label: "Shared land anchor", value: `${site.areaHa} ha · ${site.useCase}` });
          berPlusNote = site.notes;
        }
      }
    }
  }

  return {
    match,
    member,
    coordinationHint: coordinationHintFor(member),
    whyMatch: [...new Set(whyMatch)],
    facts,
    berPlusNote,
    peerContext,
    sharedLand
  };
}
