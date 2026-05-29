/**
 * Personalized recommendations & follow-up demos per Mitglied.
 */

import {
  CATEGORY_MEMBER_PATHS,
  COORDINATION_THEMES,
  MEMBER_PATH_OVERRIDES
} from "@/data/ber-plus-coordination";
import { BER_LAND_SITES } from "@/data/ber-land-sites";
import { getMitgliedById, MITGLIEDER, type Mitglied } from "@/data/mitglieder";
import { LAND_SITE_MEMBER_IDS } from "@/lib/member-osm-links";
import type { LeftTab } from "@/components/BerPlusValuePanel";

export type MemberRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  cta: string;
  tab: LeftTab;
  peerMemberId?: string;
  landSiteId?: string;
};

const THEME_BY_CATEGORY: Partial<Record<Mitglied["category"], string>> = {
  developer: "matching",
  investor: "visibility",
  infrastructure: "visibility",
  consulting: "coordination",
  public: "coordination"
};

function peersOnLand(memberId: string): { peerId: string; siteId: string; siteName: string }[] {
  const out: { peerId: string; siteId: string; siteName: string }[] = [];
  for (const [siteId, ids] of Object.entries(LAND_SITE_MEMBER_IDS)) {
    if (!ids.includes(memberId)) continue;
    const site = BER_LAND_SITES.find((s) => s.id === siteId);
    for (const peerId of ids) {
      if (peerId === memberId) continue;
      out.push({
        peerId,
        siteId,
        siteName: site?.name.split("—")[0].trim() ?? siteId
      });
    }
  }
  return out;
}

export function getMemberRecommendations(
  memberId: string,
  osmLinkCount = 0
): MemberRecommendation[] {
  const member = getMitgliedById(memberId);
  if (!member) return [];

  const recs: MemberRecommendation[] = [];

  const pathOverride = MEMBER_PATH_OVERRIDES[memberId];
  const pathSteps = pathOverride?.steps ?? CATEGORY_MEMBER_PATHS[member.category];
  if (pathSteps[0]) {
    recs.push({
      id: "path-1",
      priority: "high",
      title: pathSteps[0].problem,
      detail: pathSteps[0].youSee,
      cta: pathSteps[0].youDo,
      tab: pathSteps[0].mapFocus
    });
  }

  for (const site of BER_LAND_SITES) {
    const linked = LAND_SITE_MEMBER_IDS[site.id] ?? [];
    if (!linked.includes(memberId)) continue;
    recs.push({
      id: `land-${site.id}`,
      priority: site.status === "confirmed" ? "high" : "medium",
      title: `Explore ${site.name.split("—")[0].trim()}`,
      detail: `${site.areaHa} ha · ${site.useCase}. ${site.berPlusRole}`,
      cta: "Open OSM Intel → Land and fly to anchor on map",
      tab: "junqingchu",
      landSiteId: site.id
    });
  }

  const peers = peersOnLand(memberId);
  for (const { peerId, siteId, siteName } of peers.slice(0, 3)) {
    const peer = getMitgliedById(peerId);
    if (!peer) continue;
    recs.push({
      id: `peer-${peerId}-${siteId}`,
      priority: "medium",
      title: `Match with ${peer.shortName} at ${siteName}`,
      detail: `Shared land anchor — compare corridor roles and OSM-linked assets.`,
      cta: "Open peer profile and linked OSM list",
      tab: "members",
      peerMemberId: peerId
    });
  }

  if (osmLinkCount > 0) {
    recs.push({
      id: "osm-visibility",
      priority: "high",
      title: `${osmLinkCount} corridor assets linked to ${member.shortName}`,
      detail:
        "Member-linked OSM highlights show proximity matches — name, land anchor, corridor zone.",
      cta: "Click linked assets in your profile to locate on map",
      tab: "junqingchu"
    });
  } else {
    recs.push({
      id: "osm-onboard",
      priority: "medium",
      title: "Verify your first OSM link",
      detail: COORDINATION_THEMES.find((t) => t.id === "member-value")?.platformAnswer ?? "",
      cta: "BER+ onboarding: one land or infra target on the map",
      tab: "junqingchu"
    });
  }

  const themeId = THEME_BY_CATEGORY[member.category] ?? "matching";
  const theme = COORDINATION_THEMES.find((t) => t.id === themeId);
  if (theme) {
    recs.push({
      id: `theme-${themeId}`,
      priority: "low",
      title: theme.title,
      detail: theme.memberPain,
      cta: theme.firstStep,
      tab: themeId === "coordination" ? "programme" : "value"
    });
  }

  if (member.category === "developer" || member.category === "infrastructure") {
    recs.push({
      id: "pilot-1",
      priority: memberId === "segro" || memberId === "goldbeck" ? "high" : "low",
      title: "Pilot-1 validate window (Phase I)",
      detail: "2 ha SEGRO North Cargo — PV, BESS, EWF demo · 12–24 months",
      cta: "Programme tab → Phase I milestones",
      tab: "programme"
    });
  }

  return recs;
}

export function getMemberFollowUpDemo(memberId: string): {
  headline: string;
  steps: { label: string; tab: LeftTab }[];
} {
  const member = getMitgliedById(memberId);
  if (!member) {
    return { headline: "Corridor demo", steps: [] };
  }

  const override = MEMBER_PATH_OVERRIDES[memberId];
  if (override) {
    return {
      headline: override.headline,
      steps: override.steps.map((s) => ({
        label: s.problem,
        tab: s.mapFocus
      }))
    };
  }

  return {
    headline: `Your corridor footprint · ${member.shortName}`,
    steps: CATEGORY_MEMBER_PATHS[member.category].map((s) => ({
      label: s.problem,
      tab: s.mapFocus
    }))
  };
}

export function listMembersForPicker(): Mitglied[] {
  return MITGLIEDER;
}
