import { BER_LAND_SITES } from "@/data/ber-land-sites";
import { MITGLIEDER } from "@/data/mitglieder";
import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import { haversineKm } from "@/lib/geo";

export type MemberOsmProfile = {
  id: string;
  /** Direct text match (name, operator, brand) */
  keywords: string[];
  /** Thematic OSM / corridor terms when combined with proximity */
  topics?: string[];
  /** BER+ curated land site ids */
  landSiteIds?: string[];
  /** Link OSM near member map pin within this radius */
  proximityKm?: number;
  proximityCategories?: OsmIntelCategory[];
};

/** Per-member OSM matching rules — names, projects, corridor themes */
export const MEMBER_OSM_PROFILES: MemberOsmProfile[] = [
  {
    id: "adler",
    keywords: ["adler group", "adler ag", "adler real estate"],
    topics: ["wohnungsbau", "residential", "portfolio", "immobilien"]
  },
  {
    id: "alpine",
    keywords: ["alpine immobilien", "alpine group"],
    topics: ["projektentwicklung", "development", "bautrager"]
  },
  {
    id: "arcadis",
    keywords: ["arcadis"],
    topics: ["engineering", "environmental", "programme", "infrastruktur", "planning"]
  },
  {
    id: "buwog",
    keywords: ["buwog", "neue mitte schonfeld", "neue mitte schoenefeld", "schonefeld nord", "schönefeld nord"],
    landSiteIds: ["schoenefeld-nord", "neue-mitte"],
    proximityKm: 2.5,
    proximityCategories: ["land", "industry", "utilities", "transport"]
  },
  {
    id: "edistherm",
    keywords: ["edistherm", "e.distherm", "distherm", "e.on", "fernwarme", "nahwarme", "warmeversorgung"],
    topics: ["wärmenetz", "warmenetz", "district heating", "heating", "thermal"],
    proximityKm: 4,
    proximityCategories: ["power", "utilities", "industry"]
  },
  {
    id: "gsg",
    keywords: ["gsg berlin", "gsg group"],
    topics: ["stadterneuerung", "urban regeneration", "quartier", "mixed-use"]
  },
  {
    id: "reiss",
    keywords: ["reiss", "reiß", "reiss & co"],
    topics: ["gewerbe", "commercial real estate", "brokerage", "leasing"]
  },
  {
    id: "sector-seven",
    keywords: ["sector seven", "sector-seven"],
    topics: ["investment", "private equity", "capital", "flughafenregion"]
  },
  {
    id: "taurecon",
    keywords: ["taurecon", "bergander"],
    topics: ["immobilienberatung", "strategy", "advisory", "flughafenregion"]
  },
  {
    id: "wfg-lds",
    keywords: [
      "wfg",
      "wirtschaftsforderung dahme",
      "wirtschaftsförderung dahme",
      "dahme-spreewald",
      "landkreis dahme",
      "zlr wildau",
      "luft- und raumfahrt",
      "wildau"
    ],
    landSiteIds: ["mellensee-south"],
    proximityKm: 5,
    proximityCategories: ["land", "industry", "aeroway", "transport"]
  },
  {
    id: "wfb",
    keywords: [
      "wfb",
      "wirtschaftsinitiative flughafenregion",
      "flughafenregion brandenburg",
      "flughafenregion"
    ],
    topics: ["flughafenregion", "brandenburg", "sme", "network"],
    landSiteIds: ["horizn-ber"],
    proximityKm: 4,
    proximityCategories: ["aeroway", "industry", "land", "transport"]
  },
  {
    id: "periskop",
    keywords: ["periskop"],
    topics: ["projektentwicklung", "investor", "governance", "flughafenumfeld"]
  },
  {
    id: "goldbeck",
    keywords: ["goldbeck"],
    topics: ["modular", "logistics", "industrial building", "construction", "gewerbebau"],
    landSiteIds: ["wassmannsdorf-gewerbe"],
    proximityKm: 3.5,
    proximityCategories: ["industry", "land", "transport"]
  },
  {
    id: "segro",
    keywords: [
      "segro",
      "segro park",
      "logistics park schonfeld",
      "logistics park schoenefeld",
      "logistikpark schonfeld",
      "logistikpark schoenefeld",
      "logistikpark berlin",
      "north cargo"
    ],
    landSiteIds: ["pilot-1-segro", "segro-park"],
    proximityKm: 3,
    proximityCategories: ["industry", "land", "power", "transport", "aeroway"]
  }
];

const MEMBER_BY_ID = new Map(MITGLIEDER.map((m) => [m.id, m]));
const PROFILE_BY_ID = new Map(MEMBER_OSM_PROFILES.map((p) => [p.id, p]));

/** Curated land anchor → member ids */
export const LAND_SITE_MEMBER_IDS: Record<string, string[]> = {
  "pilot-1-segro": ["segro", "periskop", "goldbeck"],
  "segro-park": ["segro", "goldbeck", "edistherm"],
  "schoenefeld-nord": ["buwog", "edistherm", "wfg-lds", "arcadis"],
  "neue-mitte": ["buwog", "edistherm"],
  "wassmannsdorf-gewerbe": ["segro", "goldbeck", "sector-seven"],
  "horizn-ber": ["wfb", "arcadis", "taurecon"],
  "mellensee-south": ["wfg-lds", "segro", "sector-seven"]
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9+\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pointInRing(point: [number, number], ring: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function landSiteRing(siteId: string): [number, number][] | null {
  const site = BER_LAND_SITES.find((s) => s.id === siteId);
  if (!site) return null;
  if (site.footprint?.length) {
    const ring = [...site.footprint];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
    return ring;
  }
  return null;
}

function matchLandSites(center: [number, number] | null): string[] {
  if (!center) return [];
  const found = new Set<string>();
  for (const site of BER_LAND_SITES) {
    const members = LAND_SITE_MEMBER_IDS[site.id];
    if (!members?.length) continue;
    const ring = landSiteRing(site.id);
    if (ring && pointInRing(center, ring)) {
      for (const m of members) found.add(m);
      continue;
    }
    if (haversineKm(center, site.coordinates) < 1.5) {
      for (const m of members) found.add(m);
    }
  }
  return [...found];
}

export type MemberOsmMatch = {
  memberIds: string[];
  memberLabels: string;
  primaryMemberId: string;
  memberLinked: boolean;
  memberMatchKinds: string;
};

function shortName(id: string): string {
  return MEMBER_BY_ID.get(id)?.shortName ?? id;
}

export function matchOsmToMembers(input: {
  name: string;
  tags: Record<string, string>;
  category: OsmIntelCategory;
  subcategory: string;
  center: [number, number] | null;
}): MemberOsmMatch {
  const tagText = Object.entries(input.tags)
    .map(([k, v]) => `${k} ${v}`)
    .join(" ");
  const hay = normalize(`${input.name} ${tagText} ${input.subcategory}`);

  const scores = new Map<string, { score: number; kinds: Set<string> }>();

  const add = (id: string, score: number, kind: string) => {
    const cur = scores.get(id) ?? { score: 0, kinds: new Set<string>() };
    cur.score += score;
    cur.kinds.add(kind);
    scores.set(id, cur);
  };

  for (const profile of MEMBER_OSM_PROFILES) {
    for (const kw of profile.keywords) {
      if (hay.includes(normalize(kw))) add(profile.id, 12, "keyword");
    }
    for (const topic of profile.topics ?? []) {
      if (hay.includes(normalize(topic))) add(profile.id, 4, "topic");
    }

    if (input.center && profile.proximityKm && profile.proximityCategories?.includes(input.category)) {
      const member = MEMBER_BY_ID.get(profile.id);
      if (member) {
        const d = haversineKm(input.center, member.coordinates);
        if (d <= profile.proximityKm) {
          add(profile.id, Math.max(2, 8 - d), "proximity");
        }
      }
    }
  }

  for (const memberId of matchLandSites(input.center)) {
    add(memberId, 15, "land-anchor");
  }

  const memberIds = [...scores.entries()]
    .filter(([, v]) => v.score >= 4)
    .sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]))
    .map(([id]) => id);

  const primaryMemberId = memberIds[0] ?? "";
  const memberLabels = memberIds.map(shortName).join(" · ");
  const memberMatchKinds = memberIds.length
    ? memberIds
        .map((id) => {
          const kinds = scores.get(id)?.kinds;
          return kinds ? `${shortName(id)}:${[...kinds].join("+")}` : shortName(id);
        })
        .join("; ")
    : "";

  return {
    memberIds,
    memberLabels,
    primaryMemberId,
    memberLinked: memberIds.length > 0,
    memberMatchKinds
  };
}

export function countMemberOsmLinks(
  features: GeoJSON.Feature[]
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(MITGLIEDER.map((m) => [m.id, 0]));
  for (const f of features) {
    const ids = (f.properties as { memberIds?: string })?.memberIds;
    if (!ids) continue;
    for (const id of ids.split(",").filter(Boolean)) {
      if (id in counts) counts[id]++;
    }
  }
  return counts;
}

export function getMemberOsmFeatures(
  geojson: GeoJSON.FeatureCollection,
  memberId: string
): GeoJSON.Feature[] {
  return geojson.features.filter((f) => {
    const ids = (f.properties as { memberIds?: string })?.memberIds ?? "";
    return ids.split(",").includes(memberId);
  });
}

export function getMemberProfile(id: string): MemberOsmProfile | undefined {
  return PROFILE_BY_ID.get(id);
}
