import type { CorridorGraph, GraphEdge } from "@/lib/member-asset-graph";
import type { RenderEdge, RenderNode } from "@/lib/graph-render-snapshot";
import { mgTrace, mgTraceBegin } from "@/lib/matching-graph-trace";

/** What edges to draw (nodes always full). */
export type EdgeDisplayMode = "key" | "matching" | "all";

export type ScoredDisplayEdge = RenderEdge & {
  graphIndex: number;
  stretch: number;
  matchScore: number;
};

const MAX_BY_MODE: Record<EdgeDisplayMode, number> = {
  key: 72,
  matching: 160,
  all: 320
};

const MAX_STRETCH: Record<EdgeDisplayMode, number> = {
  key: 1100,
  matching: 1600,
  all: 2400
};

function edgeStretch(a: RenderNode, b: RenderNode): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Higher = more important to show */
export function scoreGraphEdge(edge: GraphEdge, stretch: number): number {
  let score = 40;

  if (edge.id.startsWith("land-") && !edge.id.includes("osm")) score = 95;
  else if (edge.id.startsWith("pilot-")) score = 88;
  else if (edge.id === "hub-segro" || edge.id === "hub-buwog") score = 82;
  else if (edge.id.startsWith("hub-focus")) score = 92;
  else if (edge.id.startsWith("zone-")) score = 70;
  else if (edge.id.startsWith("infra-")) score = 65;
  else if (edge.id.startsWith("osm-") && !edge.id.includes("land")) score = 55;
  else if (edge.id.startsWith("land-osm-")) score = 38;
  else if (edge.id.startsWith("peer-")) score = 32;
  else if (edge.id.startsWith("hub-spoke-")) score = 28;
  else if (edge.id.startsWith("hub-land-")) score = 45;
  else if (edge.id.startsWith("corridor-")) score = 22;

  score += Math.min(edge.memberIds.length, 4) * 4;
  if (edge.label?.includes("shared") || edge.label?.includes("OSM")) score += 3;

  // Prefer shorter, local links over corridor-spanning hairballs
  const stretchPenalty = Math.min(35, stretch / 45);
  score -= stretchPenalty;

  return score;
}

function tierAllowsInKey(edge: GraphEdge): boolean {
  if (edge.id.startsWith("hub-spoke-")) return false;
  if (edge.id.startsWith("land-osm-")) return false;
  if (edge.id.startsWith("peer-")) return false;
  if (edge.id.startsWith("corridor-")) return false;
  if (edge.id.startsWith("hub-land-")) return false;
  if (edge.id.startsWith("osm-")) return false;
  return true;
}

function tierAllowsInMatching(edge: GraphEdge): boolean {
  if (edge.id.startsWith("hub-spoke-")) return false;
  if (edge.id.startsWith("corridor-")) return false;
  return true;
}

export function selectDisplayEdges(input: {
  graph: CorridorGraph;
  renderEdges: RenderEdge[];
  nodes: RenderNode[];
  nodeIndex: Map<string, number>;
  mode: EdgeDisplayMode;
  focusMemberId: string | null;
  zoomPct: number;
}): ScoredDisplayEdge[] {
  const end = mgTraceBegin("edges", `select:${input.mode}`);
  const { graph, renderEdges, nodes, nodeIndex, mode, focusMemberId, zoomPct } = input;
  const maxEdges = MAX_BY_MODE[mode];
  const maxStretch = MAX_STRETCH[mode];
  const edgeById = new Map(graph.edges.map((e, i) => [e.id, { e, i }]));

  const scored: ScoredDisplayEdge[] = [];

  for (const re of renderEdges) {
    const meta = edgeById.get(re.id);
    if (!meta) continue;
    const { e, i } = meta;
    const fi = nodeIndex.get(e.from);
    const ti = nodeIndex.get(e.to);
    if (fi === undefined || ti === undefined) continue;
    const stretch = edgeStretch(nodes[fi], nodes[ti]);
    if (stretch > maxStretch) continue;

    if (mode === "key" && !tierAllowsInKey(e)) continue;
    if (mode === "matching" && !tierAllowsInMatching(e)) continue;

    const matchScore = scoreGraphEdge(e, stretch);
    scored.push({
      ...re,
      graphIndex: i,
      stretch,
      matchScore
    });
  }

  scored.sort((a, b) => b.matchScore - a.matchScore || a.stretch - b.stretch);

  const picked = new Map<number, ScoredDisplayEdge>();
  const pick = (edge: ScoredDisplayEdge) => {
    if (picked.has(edge.graphIndex)) return;
    picked.set(edge.graphIndex, edge);
  };

  // Focus member: highest-priority edges first (still capped)
  if (focusMemberId) {
    let focusCount = 0;
    for (const s of scored) {
      if (focusCount >= maxEdges) break;
      if (graph.edges[s.graphIndex].memberIds.includes(focusMemberId)) {
        pick(s);
        focusCount++;
      }
    }
  }

  // Zoom bonus: more OSM edges when zoomed in
  const osmBudget =
    mode === "all" ? 120 : mode === "matching" ? 60 : zoomPct >= 140 ? 24 : 0;
  let osmPicked = 0;

  for (const s of scored) {
    if (picked.size >= maxEdges) break;
    const e = graph.edges[s.graphIndex];
    if (e.id.startsWith("osm-") || e.id.startsWith("land-osm-")) {
      if (osmPicked >= osmBudget && mode === "key") continue;
      osmPicked++;
    }
    pick(s);
  }

  const out = [...picked.values()];
  end();
  mgTrace("edges", "picked", {
    mode,
    scored: scored.length,
    picked: out.length,
    focus: focusMemberId,
    zoomPct
  });
  return out;
}

export const EDGE_MODE_LABELS: Record<EdgeDisplayMode, string> = {
  key: "Key links",
  matching: "Matching",
  all: "All links"
};
