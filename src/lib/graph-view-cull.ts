import type { CorridorGraph, GraphEdge, GraphNode, GraphViewport } from "@/lib/member-asset-graph";

export type GraphDetailLevel = "overview" | "medium" | "full";

export function detailLevelForZoom(zoomPct: number): GraphDetailLevel {
  if (zoomPct <= 55) return "overview";
  if (zoomPct <= 130) return "medium";
  return "full";
}

export function expandViewport(vp: GraphViewport, marginRatio = 0.12): GraphViewport {
  const mx = vp.width * marginRatio;
  const my = vp.height * marginRatio;
  return { x: vp.x - mx, y: vp.y - my, width: vp.width + mx * 2, height: vp.height + my * 2 };
}

export function nodeIntersectsViewport(node: GraphNode, bounds: GraphViewport, pad = 88): boolean {
  return (
    node.x + pad >= bounds.x &&
    node.x - pad <= bounds.x + bounds.width &&
    node.y + pad >= bounds.y &&
    node.y - pad <= bounds.y + bounds.height
  );
}

function edgePriority(edge: GraphEdge, highlightEdgeIds: Set<string>): number {
  if (highlightEdgeIds.has(edge.id)) return 1000;
  if (edge.id.startsWith("land-") && !edge.id.includes("osm")) return 80;
  if (edge.id.startsWith("pilot-")) return 75;
  if (edge.id.startsWith("zone-")) return 70;
  if (edge.id.startsWith("hub-focus")) return 90;
  if (edge.id.startsWith("hub-spoke") || edge.id.startsWith("hub-land")) return 40;
  if (edge.id.startsWith("osm-")) return 25;
  if (edge.id.startsWith("peer-")) return 15;
  if (edge.id.startsWith("corridor-") || edge.id.startsWith("land-osm")) return 8;
  return 20;
}

const OVERVIEW_NODE = (n: GraphNode) =>
  n.kind === "airport" ||
  n.kind === "land" ||
  n.kind === "member" ||
  n.id.startsWith("zone-") ||
  (n.kind === "infra" && !n.id.startsWith("osm-"));

const OVERVIEW_EDGE = (e: GraphEdge) =>
  (e.id.startsWith("land-") && !e.id.includes("osm")) ||
  e.id.startsWith("zone-") ||
  e.id.startsWith("pilot-") ||
  e.id.startsWith("hub-spoke-") ||
  e.id.startsWith("hub-land-") ||
  e.id === "hub-segro" ||
  e.id === "hub-buwog" ||
  e.id.startsWith("hub-focus");

export type CulledGraphView = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  detail: GraphDetailLevel;
  nodeById: Map<string, GraphNode>;
  visibleCount: {
    nodes: number;
    edges: number;
    totalNodes: number;
    totalEdges: number;
  };
};

export function cullGraphView(input: {
  graph: CorridorGraph;
  viewport: GraphViewport;
  zoomPct: number;
  highlightEdgeIds: Set<string>;
  highlightNodeIds: Set<string>;
  enableCulling: boolean;
}): CulledGraphView {
  const { graph, viewport, zoomPct, highlightEdgeIds, highlightNodeIds, enableCulling } = input;
  const totalNodes = graph.nodes.length;
  const totalEdges = graph.edges.length;
  const nodeByIdFull = new Map(graph.nodes.map((n) => [n.id, n]));

  if (!enableCulling) {
    return {
      nodes: graph.nodes,
      edges: graph.edges,
      detail: "full",
      nodeById: nodeByIdFull,
      visibleCount: { nodes: totalNodes, edges: totalEdges, totalNodes, totalEdges }
    };
  }

  const detail = detailLevelForZoom(zoomPct);
  const bounds = expandViewport(
    viewport,
    detail === "full" ? 0.1 : detail === "medium" ? 0.18 : 0
  );

  const nodeSet = new Map<string, GraphNode>();

  if (detail === "overview") {
    for (const n of graph.nodes) {
      if (OVERVIEW_NODE(n)) nodeSet.set(n.id, n);
    }
  } else {
    for (const n of graph.nodes) {
      if (detail === "medium" && n.kind === "osm" && !(n.memberIds?.length ?? 0)) continue;
      if (nodeIntersectsViewport(n, bounds)) nodeSet.set(n.id, n);
    }
  }

  for (const id of highlightNodeIds) {
    const n = nodeByIdFull.get(id);
    if (n) nodeSet.set(id, n);
  }

  const visibleNodeIds = new Set(nodeSet.keys());
  let edges: GraphEdge[] = [];

  if (detail === "overview") {
    edges = graph.edges.filter(
      (e) =>
        (OVERVIEW_EDGE(e) || highlightEdgeIds.has(e.id)) &&
        visibleNodeIds.has(e.from) &&
        visibleNodeIds.has(e.to)
    );
  } else {
    edges = graph.edges.filter((e) => {
      if (!visibleNodeIds.has(e.from) || !visibleNodeIds.has(e.to)) return false;
      if (highlightEdgeIds.has(e.id)) return true;
      if (detail === "medium") {
        if (e.id.startsWith("peer-")) return false;
        if (e.id.startsWith("land-osm-")) return false;
        if (e.id.startsWith("corridor-")) return false;
      }
      return true;
    });
  }

  const maxEdges = detail === "full" ? 280 : detail === "medium" ? 160 : 72;
  if (edges.length > maxEdges) {
    edges = [...edges]
      .sort((a, b) => edgePriority(b, highlightEdgeIds) - edgePriority(a, highlightEdgeIds))
      .slice(0, maxEdges);
  }

  const nodes = [...nodeSet.values()];

  return {
    nodes,
    edges,
    detail,
    nodeById: nodeSet,
    visibleCount: {
      nodes: nodes.length,
      edges: edges.length,
      totalNodes,
      totalEdges
    }
  };
}
