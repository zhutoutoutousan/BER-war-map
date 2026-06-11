import { BER_LAND_SITES } from "@/data/ber-land-sites";

export type InventoryLayerType = "assets" | "land" | "infrastructure" | "development";

export type InventoryItemStatus =
  | "indicative"
  | "member_draft"
  | "pending_review"
  | "verified"
  | "needs_update";

export type InventoryVisibility = "public" | "members";

export type InventoryHistoryEntry = {
  at: string;
  actor: string;
  action: string;
};

export type CollaborativeInventoryItem = {
  id: string;
  layer: InventoryLayerType;
  title: string;
  description: string;
  memberIds: string[];
  status: InventoryItemStatus;
  visibility: InventoryVisibility;
  ha?: number;
  landSiteId?: string;
  phase?: string;
  counterpartSought?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  history: InventoryHistoryEntry[];
};

export const INVENTORY_LAYER_LABELS: Record<InventoryLayerType, string> = {
  assets: "Asset inventory",
  land: "Land inventory",
  infrastructure: "Infrastructure inventory",
  development: "Development opportunity inventory"
};

export const INVENTORY_LAYER_SHORT: Record<InventoryLayerType, string> = {
  assets: "Assets",
  land: "Land",
  infrastructure: "Infra",
  development: "Opportunities"
};

export const INVENTORY_STATUS_LABELS: Record<InventoryItemStatus, string> = {
  indicative: "Indicative · map step 1",
  member_draft: "Member draft",
  pending_review: "Pending BER+ review",
  verified: "Verified · co-inventory",
  needs_update: "Needs update"
};

export const INVENTORY_STATUS_COLORS: Record<InventoryItemStatus, string> = {
  indicative: "#94a3b8",
  member_draft: "#fbbf24",
  pending_review: "#38bdf8",
  verified: "#34d399",
  needs_update: "#f87171"
};

const now = () => new Date().toISOString();

function hist(actor: string, action: string): InventoryHistoryEntry {
  return { at: now(), actor, action };
}

/** Demo seed — mixes indicative OSM anchors with member workflow states */
export function buildSeedInventory(): CollaborativeInventoryItem[] {
  const pilot = BER_LAND_SITES.find((s) => s.id === "pilot-1-segro")!;
  const segroPark = BER_LAND_SITES.find((s) => s.id === "segro-park")!;
  const schoenefeldNord = BER_LAND_SITES.find((s) => s.id === "schoenefeld-nord")!;

  return [
    {
      id: "inv-pilot-1-land",
      layer: "land",
      title: pilot.name,
      description: pilot.notes,
      memberIds: ["segro", "periskop", "goldbeck"],
      status: "indicative",
      visibility: "public",
      ha: pilot.areaHa,
      landSiteId: pilot.id,
      history: [hist("BER+ map", "Imported from curated land anchor · OSM step 1")]
    },
    {
      id: "inv-segro-park-land",
      layer: "land",
      title: "SEGRO Park — expansion plots",
      description: "Unbuilt roofs and spare plots inside park fence; member draft awaiting ha confirmation.",
      memberIds: ["segro", "goldbeck"],
      status: "pending_review",
      visibility: "members",
      ha: 12,
      landSiteId: segroPark.id,
      submittedAt: now(),
      history: [
        hist("SEGRO", "Submitted plot shortlist for BER+ review"),
        hist("BER+ map", "Linked to SEGRO Park land anchor")
      ]
    },
    {
      id: "inv-schoenefeld-nord",
      layer: "land",
      title: schoenefeldNord.name,
      description: "Quartiersentwicklung — BUWOG drafting availability windows for member co-inventory.",
      memberIds: ["buwog", "wfg-lds"],
      status: "member_draft",
      visibility: "members",
      ha: schoenefeldNord.areaHa,
      landSiteId: schoenefeldNord.id,
      history: [hist("BUWOG", "Started member draft — not yet submitted")]
    },
    {
      id: "inv-segro-rooftops",
      layer: "assets",
      title: "SEGRO logistics rooftops · PV-ready",
      description: "Portfolio asset register: roof area suitable for Pilot-1 replication beyond 2 ha parcel.",
      memberIds: ["segro"],
      status: "verified",
      visibility: "members",
      ha: 8.5,
      verifiedAt: now(),
      verifiedBy: "BER+ secretariat",
      history: [
        hist("SEGRO", "Published asset row"),
        hist("BER+ secretariat", "Verified in co-inventory workshop")
      ]
    },
    {
      id: "inv-few-grid",
      layer: "infrastructure",
      title: "FEW grid connection queue · corridor slice",
      description: "Indicative OSM substation + member note on connection timing — needs utility sign-off.",
      memberIds: ["edistherm", "arcadis"],
      status: "indicative",
      visibility: "members",
      history: [hist("BER+ map", "OSM power layer + briefing reference — not utility-verified")]
    },
    {
      id: "inv-pilot-1-opportunity",
      layer: "development",
      title: "Pilot-1 · Module 1.0 close",
      description: "Land + infra + anchor tenant + Phase I timing — seek co-investor for BESS stack.",
      memberIds: ["segro", "periskop", "sector-seven"],
      status: "pending_review",
      visibility: "members",
      ha: 2,
      landSiteId: pilot.id,
      phase: "Phase I · validate",
      counterpartSought: "Infrastructure investor · BESS",
      submittedAt: now(),
      history: [
        hist("SEGRO", "Submitted development opportunity card"),
        hist("BER+ secretariat", "Queued for board review")
      ]
    },
    {
      id: "inv-wfg-briefing",
      layer: "assets",
      title: "WFG LDS · regional coordination dossier",
      description: "Economic development asset: county portfolio links and member intro paths.",
      memberIds: ["wfg-lds"],
      status: "verified",
      visibility: "public",
      verifiedAt: now(),
      verifiedBy: "BER+ secretariat",
      history: [hist("WFG LDS", "Shared public coordination asset"), hist("BER+ secretariat", "Verified")]
    },
    {
      id: "inv-mellensee-gewerbe",
      layer: "development",
      title: "Mellensee south · gewerbe matching",
      description: "OSM industrial tag + member interest — counterpart for logistics operator sought.",
      memberIds: ["wfg-lds", "segro", "sector-seven"],
      status: "member_draft",
      visibility: "members",
      ha: 15,
      landSiteId: "mellensee-south",
      counterpartSought: "Logistics operator",
      history: [hist("WFG LDS", "Draft opportunity — proximity unverified on map")]
    }
  ];
}

export const STORAGE_KEY = "ber-war-map-collab-inventory-v1";
