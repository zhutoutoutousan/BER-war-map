import type { CorridorGraph, GraphEdge, GraphNode } from "@/lib/member-asset-graph";
import type { GraphDetailLevel } from "@/lib/graph-view-cull";

export type RenderNode = {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  kind: GraphNode["kind"];
  label: string;
  sublabel?: string;
  isOsm: boolean;
};

export type RenderEdge = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  straight: boolean;
  isHubSpoke: boolean;
};

export type GraphRenderSnapshot = {
  width: number;
  height: number;
  nodes: RenderNode[];
  edges: RenderEdge[];
  nodeIndex: Map<string, number>;
  /** Spatial hash for hit tests */
  hitCells: Map<string, number[]>;
};

const CELL = 100;

function nodeRadius(node: GraphNode, giant: boolean): number {
  const scale = giant ? 1.35 : 1;
  const isOsm = node.kind === "osm" || node.id.startsWith("osm-");
  if (isOsm) return 14 * scale;
  if (node.kind === "airport") return 24 * scale;
  if (node.kind === "land") return 18 * scale;
  return 11 * scale;
}

export function buildRenderSnapshot(graph: CorridorGraph, giant = true): GraphRenderSnapshot {
  const nodeIndex = new Map<string, number>();
  const nodes: RenderNode[] = graph.nodes.map((n, i) => {
    nodeIndex.set(n.id, i);
    const isOsm = n.kind === "osm" || n.id.startsWith("osm-");
    return {
      id: n.id,
      x: n.x,
      y: n.y,
      r: nodeRadius(n, giant),
      color: n.color,
      kind: n.kind,
      label: n.label,
      sublabel: n.sublabel,
      isOsm
    };
  });

  const edges: RenderEdge[] = [];
  for (const e of graph.edges) {
    const from = nodeIndex.get(e.from);
    const to = nodeIndex.get(e.to);
    if (from === undefined || to === undefined) continue;
    const a = nodes[from];
    const b = nodes[to];
    const straight =
      e.id.startsWith("osm-") ||
      e.id.startsWith("land-osm-") ||
      e.id.startsWith("corridor-") ||
      e.id.startsWith("hub-spoke-");
    edges.push({
      id: e.id,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      straight,
      isHubSpoke: e.id.startsWith("hub-spoke-")
    });
  }

  const hitCells = new Map<string, number[]>();
  nodes.forEach((n, i) => {
    const cx = Math.floor(n.x / CELL);
    const cy = Math.floor(n.y / CELL);
    const key = `${cx},${cy}`;
    const list = hitCells.get(key) ?? [];
    list.push(i);
    hitCells.set(key, list);
  });

  return { width: graph.width, height: graph.height, nodes, edges, nodeIndex, hitCells };
}

export function computeHighlightSets(
  graph: CorridorGraph,
  memberId: string | null
): {
  activeNodes: Uint8Array | null;
  activeEdges: Uint8Array | null;
  dim: boolean;
} {
  if (!memberId) {
    return { activeNodes: null, activeEdges: null, dim: false };
  }

  const activeNodes = new Uint8Array(graph.nodes.length);
  const activeEdges = new Uint8Array(graph.edges.length);
  const nodeIndex = new Map(graph.nodes.map((n, i) => [n.id, i]));

  const mid = `member-${memberId}`;
  const ni = nodeIndex.get(mid);
  if (ni !== undefined) activeNodes[ni] = 1;

  graph.edges.forEach((e, i) => {
    if (e.memberIds.includes(memberId)) {
      activeEdges[i] = 1;
      const fi = nodeIndex.get(e.from);
      const ti = nodeIndex.get(e.to);
      if (fi !== undefined) activeNodes[fi] = 1;
      if (ti !== undefined) activeNodes[ti] = 1;
    }
  });

  return { activeNodes, activeEdges, dim: true };
}

export function hitTestNode(
  snapshot: GraphRenderSnapshot,
  graphX: number,
  graphY: number,
  maxDist = 36
): string | null {
  const cx = Math.floor(graphX / CELL);
  const cy = Math.floor(graphY / CELL);
  let best: { id: string; d: number } | null = null;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const list = snapshot.hitCells.get(`${cx + dx},${cy + dy}`);
      if (!list) continue;
      for (const idx of list) {
        const n = snapshot.nodes[idx];
        const d = Math.hypot(n.x - graphX, n.y - graphY);
        const limit = n.r + maxDist;
        if (d <= limit && (!best || d < best.d)) best = { id: n.id, d };
      }
    }
  }
  return best?.id ?? null;
}

export function labelPolicy(detail: GraphDetailLevel, zoomPct: number) {
  return {
    members: detail !== "overview",
    osm: detail === "full" && zoomPct >= 150,
    sublabels: detail === "full" && zoomPct >= 170
  };
}
