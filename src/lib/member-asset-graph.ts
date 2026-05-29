/**
 * Corridor panorama graph — nodes & edges for the "scroll map" view.
 * Layout follows geography (west → east) like a corridor scroll painting.
 */

import { BER_LAND_SITES } from "@/data/ber-land-sites";
import { CATEGORY_COLORS, MITGLIEDER, type Mitglied } from "@/data/mitglieder";
import { LAND_SITE_MEMBER_IDS } from "@/lib/member-osm-links";
import { centroidOf } from "@/lib/osm-intel-lookup";
import { adjustOsmLinkScore, includeOsmInMemberGraph } from "@/lib/osm-match-quality";
import { displayNameForOsmFeature } from "@/lib/osm-display-name";
import {
  clampToCanvas,
  corridorLatToY,
  corridorLngToX,
  layoutMemberFocusGraph,
  spreadCollisions,
  type LayoutPoint
} from "@/lib/graph-layout";

export type GraphNodeKind = "airport" | "land" | "member" | "infra" | "osm";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  color: string;
  areaHa?: number;
  memberIds?: string[];
  /** For OSM nodes */
  osmFeatureId?: string;
  landSiteId?: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  memberIds: string[];
};

export type CorridorGraph = {
  width: number;
  height: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const PAN_W = 2800;
const PAN_H = 420;
const PAD_X = 80;
const PAD_Y = 60;

/** Corridor bounding box (lng/lat) for west→east scroll */
const BBOX = { minLng: 13.34, maxLng: 13.58, minLat: 52.328, maxLat: 52.405 };

function lngToX(lng: number): number {
  const t = (lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng);
  return PAD_X + t * (PAN_W - PAD_X * 2);
}

function latToY(lat: number, lane = 0): number {
  const t = (lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat);
  const base = PAD_Y + (1 - t) * (PAN_H - PAD_Y * 2);
  return base + lane * 28;
}

const INFRA_NODES: Omit<GraphNode, "x" | "y">[] = [
  {
    id: "infra-grid",
    kind: "infra",
    label: "Grid & substations",
    sublabel: "BNetzA queue · E.DIS",
    color: "#a3e635",
    memberIds: ["edistherm", "goldbeck", "segro"]
  },
  {
    id: "infra-heat",
    kind: "infra",
    label: "District heat",
    sublabel: "e.distherm · Nahwärme",
    color: "#fb923c",
    memberIds: ["edistherm", "buwog"]
  },
  {
    id: "infra-transport",
    kind: "infra",
    label: "ÖPNV & corridor",
    sublabel: "S-Bahn · B96 · logistics spine",
    color: "#38bdf8",
    memberIds: ["buwog", "wfg-lds", "arcadis"]
  }
];

function memberNode(m: Mitglied, lane: number): GraphNode {
  return {
    id: `member-${m.id}`,
    kind: "member",
    label: m.shortName,
    sublabel: m.corridorRole.slice(0, 42),
    x: lngToX(m.coordinates[0]),
    y: latToY(m.coordinates[1], lane),
    color: CATEGORY_COLORS[m.category],
    memberIds: [m.id]
  };
}

export function buildCorridorGraph(): CorridorGraph {
  const nodes: GraphNode[] = [];

  nodes.push({
    id: "hub-ber",
    kind: "airport",
    label: "BER · Flughafen",
    sublabel: "Corridor hub",
    x: lngToX(13.51),
    y: latToY(52.366, 0),
    color: "#0ea5e9",
    memberIds: ["wfb", "arcadis", "segro"]
  });

  for (const site of BER_LAND_SITES) {
    nodes.push({
      id: `land-${site.id}`,
      kind: "land",
      label: site.name.split("—")[0].trim(),
      sublabel: `${site.areaHa} ha · ${site.status}`,
      x: lngToX(site.coordinates[0]),
      y: latToY(site.coordinates[1], -1),
      color: site.status === "confirmed" ? "#10b981" : "#fbbf24",
      areaHa: site.areaHa,
      memberIds: LAND_SITE_MEMBER_IDS[site.id] ?? []
    });
  }

  MITGLIEDER.forEach((m, i) => {
    const lane = (i % 3) - 1;
    nodes.push(memberNode(m, lane));
  });

  INFRA_NODES.forEach((n, i) => {
    nodes.push({
      ...n,
      x: PAD_X + 200 + i * 820,
      y: PAN_H - PAD_Y - 20
    });
  });

  const edges: GraphEdge[] = [];

  for (const [siteId, memberIds] of Object.entries(LAND_SITE_MEMBER_IDS)) {
    for (const memberId of memberIds) {
      edges.push({
        id: `land-${siteId}-${memberId}`,
        from: `land-${siteId}`,
        to: `member-${memberId}`,
        label: "land anchor",
        memberIds: [memberId]
      });
    }
  }

  for (const memberId of ["segro", "periskop", "goldbeck"]) {
    edges.push({
      id: `pilot-${memberId}`,
      from: "land-pilot-1-segro",
      to: `member-${memberId}`,
      label: "Pilot-1",
      memberIds: [memberId]
    });
  }

  edges.push({
    id: "hub-segro",
    from: "hub-ber",
    to: "member-segro",
    label: "logistics",
    memberIds: ["segro"]
  });

  edges.push({
    id: "hub-buwog",
    from: "hub-ber",
    to: "member-buwog",
    label: "housing corridor",
    memberIds: ["buwog"]
  });

  for (const infra of INFRA_NODES) {
    for (const memberId of infra.memberIds ?? []) {
      edges.push({
        id: `${infra.id}-${memberId}`,
        from: infra.id,
        to: `member-${memberId}`,
        label: infra.label,
        memberIds: [memberId]
      });
    }
  }

  return { width: PAN_W, height: PAN_H, nodes, edges };
}

export function graphHighlightForMember(graph: CorridorGraph, memberId: string | null) {
  if (!memberId) {
    return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
  }
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  for (const edge of graph.edges) {
    if (edge.memberIds.includes(memberId)) {
      edgeIds.add(edge.id);
      nodeIds.add(edge.from);
      nodeIds.add(edge.to);
    }
  }

  nodeIds.add(`member-${memberId}`);

  return { nodeIds, edgeIds };
}

/** Navigable subgraph for one Mitglied — caps OSM so the map stays readable. */
export function egoGraphForMember(
  graph: CorridorGraph,
  memberId: string,
  options: { maxOsm?: number } = {}
): CorridorGraph {
  const maxOsm = options.maxOsm ?? 72;
  const mid = `member-${memberId}`;
  const keep = new Set<string>([mid, "hub-ber"]);

  const member = MITGLIEDER.find((m) => m.id === memberId);
  if (member) keep.add(`zone-${member.category}`);

  const osmScores = new Map<string, number>();

  for (const edge of graph.edges) {
    if (!edge.memberIds.includes(memberId)) continue;
    keep.add(edge.from);
    keep.add(edge.to);

    for (const nid of [edge.from, edge.to]) {
      if (!nid.startsWith("osm-")) continue;
      let bump = 6;
      if (edge.id.startsWith("osm-") && !edge.id.startsWith("land-osm-")) bump = 18;
      else if (edge.id.startsWith("land-osm-")) bump = 12;
      else if (edge.id.startsWith("peer-")) bump = 4;
      osmScores.set(nid, (osmScores.get(nid) ?? 0) + bump);
    }
  }

  const osmIds = [...keep].filter((id) => id.startsWith("osm-"));
  if (osmIds.length > maxOsm) {
    const ranked = osmIds
      .map((id) => ({ id, score: osmScores.get(id) ?? 0 }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const drop = new Set(ranked.slice(maxOsm).map((x) => x.id));
    for (const id of drop) keep.delete(id);
  }

  const nodes = graph.nodes.filter((n) => keep.has(n.id));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  const laid = { ...graph, nodes: nodes.map((n) => ({ ...n })), edges };
  layoutMemberFocusGraph(laid, memberId);
  return laid;
}

/** Corridor overview — members, land, zones; OSM lives in geo map / member focus. */
export function overviewGraphWithoutOsm(graph: CorridorGraph): CorridorGraph {
  const nodes = graph.nodes.filter((n) => n.kind !== "osm");
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
  return { ...graph, nodes, edges };
}

/** Optional overview OSM — corridor context samples only (not full member hairball). */
export function corridorOsmPreview(graph: CorridorGraph, max = 48): CorridorGraph {
  const keep = new Set(graph.nodes.filter((n) => n.kind !== "osm").map((n) => n.id));
  const osmIds: string[] = [];
  for (const e of graph.edges) {
    if (e.id.startsWith("corridor-hub-") && e.to.startsWith("osm-")) osmIds.push(e.to);
  }
  for (const id of osmIds.slice(0, max)) keep.add(id);
  const nodes = graph.nodes.filter((n) => keep.has(n.id));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
  return { ...graph, nodes, edges };
}

export type GraphViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function graphFullViewport(graph: CorridorGraph, padding = 0): GraphViewport {
  return {
    x: -padding,
    y: -padding,
    width: graph.width + padding * 2,
    height: graph.height + padding * 2
  };
}

export function graphViewportForNodes(
  nodes: GraphNode[],
  graph: CorridorGraph,
  padding = 120
): GraphViewport {
  if (!nodes.length) return graphFullViewport(graph);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - 80);
    maxX = Math.max(maxX, n.x + 80);
    minY = Math.min(minY, n.y - 90);
    maxY = Math.max(maxY, n.y + 100);
  }
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(
      graph.width,
      Math.max(320, maxX - minX + padding * 2)
    ),
    height: Math.min(
      graph.height,
      Math.max(240, maxY - minY + padding * 2)
    )
  };
}

export function viewportToViewBox(v: GraphViewport): string {
  return `${v.x} ${v.y} ${v.width} ${v.height}`;
}

export function zoomViewport(v: GraphViewport, factor: number, cx: number, cy: number): GraphViewport {
  const newW = v.width * factor;
  const newH = v.height * factor;
  const relX = (cx - v.x) / v.width;
  const relY = (cy - v.y) / v.height;
  return {
    x: cx - newW * relX,
    y: cy - newH * relY,
    width: newW,
    height: newH
  };
}

const MAX_ZOOM_IN = 4;

/** Keep viewport inside graph bounds and limit zoom range. */
export function clampViewport(vp: GraphViewport, graph: CorridorGraph): GraphViewport {
  const full = graphFullViewport(graph, 40);
  let width = Math.min(Math.max(vp.width, full.width / MAX_ZOOM_IN), full.width);
  let height = Math.min(Math.max(vp.height, full.height / MAX_ZOOM_IN), full.height);
  let x = vp.x + (vp.width - width) / 2;
  let y = vp.y + (vp.height - height) / 2;
  x = Math.max(full.x, Math.min(x, full.x + full.width - width));
  y = Math.max(full.y, Math.min(y, full.y + full.height - height));
  return { x, y, width, height };
}

/** Expand viewport to match container aspect so SVG meet does not letterbox void. */
export function viewportForAspect(vp: GraphViewport, aspect: number, graph: CorridorGraph): GraphViewport {
  if (!Number.isFinite(aspect) || aspect <= 0) return clampViewport(vp, graph);
  const vpAspect = vp.width / vp.height;
  let { x, y, width, height } = vp;
  if (vpAspect < aspect) {
    const newW = height * aspect;
    x -= (newW - width) / 2;
    width = newW;
  } else if (vpAspect > aspect) {
    const newH = width / aspect;
    y -= (newH - height) / 2;
    height = newH;
  }
  return clampViewport({ x, y, width, height }, graph);
}

export function panViewport(vp: GraphViewport, dx: number, dy: number, graph: CorridorGraph): GraphViewport {
  return clampViewport({ ...vp, x: vp.x + dx, y: vp.y + dy }, graph);
}

export function normalizeViewport(
  vp: GraphViewport,
  graph: CorridorGraph,
  containerAspect: number
): GraphViewport {
  return viewportForAspect(clampViewport(vp, graph), containerAspect, graph);
}

/** OSM link input for giant graph */
export type OsmGraphLink = {
  featureId: string;
  title: string;
  sublabel?: string;
  score: number;
  memberIds: string[];
  lng: number;
  lat: number;
  category?: string;
};

export type OsmLinkOptions = {
  /** Include every OSM feature with memberIds (default true) */
  allMemberLinked?: boolean;
  /** Include corridor OSM without member match */
  includeCorridor?: boolean;
  corridorMax?: number;
};

function scoreOsmLink(memberIds: string[], props: Record<string, unknown>): number {
  let score = memberIds.length * 8;
  const primary = props.primaryMemberId as string | undefined;
  if (primary && memberIds.includes(primary)) score += 6;
  const kinds = String(props.memberMatchKinds ?? "");
  if (kinds.includes("land-anchor")) score += 10;
  if (kinds.includes("keyword")) score += 6;
  if (kinds.includes("proximity")) score += 4;
  const cat = String(props.category ?? "");
  const sub = String(props.subcategory ?? "");
  if (cat === "land" || cat === "industry" || cat === "power") score += 3;
  return adjustOsmLinkScore(score, cat, sub);
}

/**
 * All member-linked OSM features + optional corridor context — with map coordinates.
 */
export function buildOsmLinksFromGeojson(
  geojson: GeoJSON.FeatureCollection | null | undefined,
  options: OsmLinkOptions = {}
): OsmGraphLink[] {
  if (!geojson) return [];
  const allMemberLinked = options.allMemberLinked !== false;
  const includeCorridor = options.includeCorridor !== false;
  const corridorMax = options.corridorMax ?? 36;

  const byFeature = new Map<string, OsmGraphLink>();
  const memberPos = new Map(MITGLIEDER.map((m) => [m.id, m.coordinates]));
  const fallbackLng = 13.51;
  const fallbackLat = 52.366;

  const toLink = (
    featureId: string,
    title: string,
    sublabel: string,
    memberIds: string[],
    score: number,
    geometry: GeoJSON.Geometry | undefined,
    category?: string
  ): OsmGraphLink => {
    const center = geometry ? centroidOf(geometry) : null;
    const primary = memberIds[0];
    const anchor = primary ? memberPos.get(primary) : null;
    return {
      featureId,
      title,
      sublabel,
      score,
      memberIds,
      lng: center?.[0] ?? anchor?.[0] ?? fallbackLng,
      lat: center?.[1] ?? anchor?.[1] ?? fallbackLat,
      category
    };
  };

  for (const f of geojson.features) {
    const p = f.properties as {
      id?: string;
      name?: string;
      category?: string;
      subcategory?: string;
      memberIds?: string;
      primaryMemberId?: string;
      memberMatchKinds?: string;
      memberLinked?: boolean;
    };
    if (!p.id) continue;
    const ids = (p.memberIds ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) continue;

    const title = displayNameForOsmFeature({
      name: p.name,
      id: p.id,
      category: p.category,
      subcategory: p.subcategory,
      tagsSummary: (p as { tagsSummary?: string }).tagsSummary,
      osmType: (p as { osmType?: string }).osmType,
      osmId: (p as { osmId?: string }).osmId
    });
    const sublabel = `${p.category ?? "osm"}/${p.subcategory ?? "feature"}`;
    const score = scoreOsmLink(ids, p);
    const existing = byFeature.get(p.id);
    if (existing) {
      const merged = [...new Set([...existing.memberIds, ...ids])];
      byFeature.set(
        p.id,
        toLink(p.id, title, sublabel, merged, Math.max(existing.score, score), f.geometry, p.category)
      );
    } else {
      byFeature.set(p.id, toLink(p.id, title, sublabel, ids, score, f.geometry, p.category));
    }
  }

  const out = allMemberLinked ? [...byFeature.values()] : [...byFeature.values()].slice(0, 80);

  if (includeCorridor) {
    let corridorN = 0;
    for (const f of geojson.features) {
      if (corridorN >= corridorMax) break;
      const p = f.properties as {
        id?: string;
        name?: string;
        category?: string;
        subcategory?: string;
        memberLinked?: boolean;
      };
      if (!p.id || p.memberLinked || byFeature.has(p.id)) continue;
      const cat = p.category ?? "";
      if (!["land", "industry", "power", "transport", "utilities"].includes(cat)) continue;
      out.push(
        toLink(
          p.id,
          p.name || p.id,
          `${cat}/${p.subcategory ?? "corridor"}`,
          [],
          1,
          f.geometry,
          cat
        )
      );
      corridorN++;
    }
  }

  return out;
}

const GIANT_W = 5200;
const GIANT_H = 1500;
const G_PAD = 100;

const MEMBER_LAND_SITES = (() => {
  const map = new Map<string, string[]>();
  for (const [siteId, memberIds] of Object.entries(LAND_SITE_MEMBER_IDS)) {
    for (const memberId of memberIds) {
      const list = map.get(memberId) ?? [];
      list.push(siteId);
      map.set(memberId, list);
    }
  }
  return map;
})();

/**
 * Full-screen matching map — geographic layout (west→east corridor).
 * All OSM nodes & relationships; collision spread prevents stacking.
 */
export function buildGiantMatchingGraph(osmLinks: OsmGraphLink[] = []): CorridorGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const hubLng = 13.51;
  const hubLat = 52.366;

  nodes.push({
    id: "hub-ber",
    kind: "airport",
    label: "BER · Flughafen",
    sublabel: "Corridor hub · matching centre",
    x: corridorLngToX(hubLng, GIANT_W, G_PAD),
    y: corridorLatToY(hubLat, GIANT_H, G_PAD, 0),
    color: "#0ea5e9",
    memberIds: ["wfb", "arcadis", "segro"]
  });

  for (const site of BER_LAND_SITES) {
    const [lng, lat] = site.coordinates;
    nodes.push({
      id: `land-${site.id}`,
      kind: "land",
      label: site.name.split("—")[0].trim(),
      sublabel: `${site.areaHa} ha · ${site.status}`,
      x: corridorLngToX(lng, GIANT_W, G_PAD),
      y: corridorLatToY(lat, GIANT_H, G_PAD, -2),
      color: site.status === "confirmed" ? "#10b981" : "#fbbf24",
      areaHa: site.areaHa,
      memberIds: LAND_SITE_MEMBER_IDS[site.id] ?? [],
      landSiteId: site.id
    });
  }

  const byCategory = new Map<Mitglied["category"], Mitglied[]>();
  for (const m of MITGLIEDER) {
    const list = byCategory.get(m.category) ?? [];
    list.push(m);
    byCategory.set(m.category, list);
  }

  for (const [category, members] of byCategory) {
    let sumLng = 0;
    let sumLat = 0;
    members.forEach((m, i) => {
      const [lng, lat] = m.coordinates;
      sumLng += lng;
      sumLat += lat;
      const lane = (i % 3) - 1;
      nodes.push({
        id: `member-${m.id}`,
        kind: "member",
        label: m.shortName,
        sublabel: m.corridorRole.slice(0, 48),
        x: corridorLngToX(lng, GIANT_W, G_PAD),
        y: corridorLatToY(lat, GIANT_H, G_PAD, lane + 4),
        color: CATEGORY_COLORS[m.category],
        memberIds: [m.id]
      });
    });

    nodes.push({
      id: `zone-${category}`,
      kind: "infra",
      label: category.replace(/^\w/, (c) => c.toUpperCase()),
      sublabel: `${members.length} Mitglieder`,
      x: corridorLngToX(sumLng / members.length, GIANT_W, G_PAD),
      y: corridorLatToY(sumLat / members.length, GIANT_H, G_PAD, 2),
      color: CATEGORY_COLORS[category],
      memberIds: members.map((m) => m.id)
    });
  }

  INFRA_NODES.forEach((n, i) => {
    const t = (i + 0.5) / INFRA_NODES.length;
    nodes.push({
      ...n,
      x: G_PAD + t * (GIANT_W - G_PAD * 2),
      y: GIANT_H - 100
    });
  });

  for (const [siteId, memberIds] of Object.entries(LAND_SITE_MEMBER_IDS)) {
    for (const memberId of memberIds) {
      edges.push({
        id: `land-${siteId}-${memberId}`,
        from: `land-${siteId}`,
        to: `member-${memberId}`,
        label: "land anchor",
        memberIds: [memberId]
      });
    }
  }

  for (const memberId of ["segro", "periskop", "goldbeck"]) {
    edges.push({
      id: `pilot-${memberId}`,
      from: "land-pilot-1-segro",
      to: `member-${memberId}`,
      label: "Pilot-1",
      memberIds: [memberId]
    });
  }

  edges.push(
    { id: "hub-segro", from: "hub-ber", to: "member-segro", label: "logistics", memberIds: ["segro"] },
    { id: "hub-buwog", from: "hub-ber", to: "member-buwog", label: "housing", memberIds: ["buwog"] }
  );

  for (const m of MITGLIEDER) {
    edges.push({
      id: `hub-spoke-${m.id}`,
      from: "hub-ber",
      to: `member-${m.id}`,
      label: "corridor",
      memberIds: [m.id]
    });
  }

  for (const site of BER_LAND_SITES) {
    edges.push({
      id: `hub-land-${site.id}`,
      from: "hub-ber",
      to: `land-${site.id}`,
      label: "anchor belt",
      memberIds: LAND_SITE_MEMBER_IDS[site.id] ?? []
    });
  }

  for (const [category, members] of byCategory) {
    for (const m of members) {
      edges.push({
        id: `zone-${category}-${m.id}`,
        from: `zone-${category}`,
        to: `member-${m.id}`,
        label: "category",
        memberIds: [m.id]
      });
    }
  }

  for (const [siteId, memberIds] of Object.entries(LAND_SITE_MEMBER_IDS)) {
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const a = memberIds[i];
        const b = memberIds[j];
        edges.push({
          id: `peer-${a}-${b}-${siteId}`,
          from: `member-${a}`,
          to: `member-${b}`,
          label: "shared anchor",
          memberIds: [a, b]
        });
      }
    }
  }

  for (const infra of INFRA_NODES) {
    for (const memberId of infra.memberIds ?? []) {
      edges.push({
        id: `${infra.id}-${memberId}`,
        from: infra.id,
        to: `member-${memberId}`,
        label: infra.label,
        memberIds: [memberId]
      });
    }
  }

  const osmLayout: LayoutPoint[] = [];
  const osmMemberLinks = osmLinks.filter((l) => l.memberIds.length > 0);
  const corridorLinks = osmLinks.filter((l) => l.memberIds.length === 0);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edgeIds = new Set(edges.map((e) => e.id));

  const addEdge = (edge: GraphEdge) => {
    if (edgeIds.has(edge.id)) return;
    edgeIds.add(edge.id);
    edges.push(edge);
  };

  for (const link of osmMemberLinks) {
    const subcategory = link.sublabel?.includes("/")
      ? link.sublabel.split("/").slice(1).join("/")
      : link.sublabel;
    if (!includeOsmInMemberGraph(link.score, link.category, subcategory)) continue;

    const id = `osm-${link.featureId}`;
    let x = corridorLngToX(link.lng, GIANT_W, G_PAD);
    let y = corridorLatToY(link.lat, GIANT_H, G_PAD, 6);
    const clamped = clampToCanvas(x, y, GIANT_W, GIANT_H, G_PAD);
    x = clamped.x;
    y = clamped.y;

    if (!nodeById.has(id)) {
      const node: GraphNode = {
        id,
        kind: "osm",
        label: link.title.slice(0, 26),
        sublabel: link.sublabel?.slice(0, 40),
        x,
        y,
        color: link.memberIds.length > 1 ? "#fcd34d" : "#fbbf24",
        memberIds: link.memberIds,
        osmFeatureId: link.featureId
      };
      nodes.push(node);
      nodeById.set(id, node);
      osmLayout.push({ id, x, y, radius: link.memberIds.length > 1 ? 16 : 12 });
    }

    for (const memberId of link.memberIds) {
      addEdge({
        id: `osm-${link.featureId}-${memberId}`,
        from: `member-${memberId}`,
        to: id,
        label: link.memberIds.length > 1 ? "shared OSM" : "OSM match",
        memberIds: [memberId]
      });

      for (const siteId of MEMBER_LAND_SITES.get(memberId) ?? []) {
        addEdge({
          id: `land-osm-${siteId}-${link.featureId}`,
          from: `land-${siteId}`,
          to: id,
          label: "site asset",
          memberIds: [memberId]
        });
      }
    }
  }

  for (let i = 0; i < corridorLinks.length; i++) {
    const link = corridorLinks[i];
    const id = `osm-${link.featureId}`;
    if (nodeById.has(id)) continue;
    let x = corridorLngToX(link.lng, GIANT_W, G_PAD);
    let y = corridorLatToY(link.lat, GIANT_H, G_PAD, 8 + (i % 3));
    const clamped = clampToCanvas(x, y, GIANT_W, GIANT_H, G_PAD);
    x = clamped.x;
    y = clamped.y;
    const node: GraphNode = {
      id,
      kind: "osm",
      label: link.title.slice(0, 22),
      sublabel: link.sublabel ?? "corridor context",
      x,
      y,
      color: "#94a3b8",
      memberIds: [],
      osmFeatureId: link.featureId
    };
    nodes.push(node);
    nodeById.set(id, node);
    osmLayout.push({ id, x, y, radius: 10 });
    addEdge({
      id: `corridor-hub-${link.featureId}`,
      from: "hub-ber",
      to: id,
      label: "corridor OSM",
      memberIds: []
    });
  }

  spreadCollisions(osmLayout, 48, 12);
  for (const pt of osmLayout) {
    const n = nodeById.get(pt.id);
    if (n) {
      const c = clampToCanvas(pt.x, pt.y, GIANT_W, GIANT_H, G_PAD);
      n.x = c.x;
      n.y = c.y;
    }
  }

  const memberLayout: LayoutPoint[] = [];
  for (const n of nodes) {
    if (n.kind !== "member") continue;
    memberLayout.push({ id: n.id, x: n.x, y: n.y, radius: 28 });
  }
  spreadCollisions(memberLayout, 36, 6);
  for (const pt of memberLayout) {
    const n = nodeById.get(pt.id);
    if (n) {
      const c = clampToCanvas(pt.x, pt.y, GIANT_W, GIANT_H, G_PAD);
      n.x = c.x;
      n.y = c.y;
    }
  }

  return { width: GIANT_W, height: GIANT_H, nodes, edges };
}
