import type { CorridorGraph } from "@/lib/member-asset-graph";
import { buildLiveMatches, type LiveMatch } from "@/lib/local-member-matching";
import { resolveMatchingNodePreview } from "@/lib/matching-node-geo";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";

/** Resolve a swipe-queue LiveMatch for a graph node in member focus mode. */
export function findLiveMatchForGraphNode(
  nodeId: string,
  memberId: string,
  graph: CorridorGraph,
  osmData: OsmIntelPayload | null
): LiveMatch | null {
  const matches = buildLiveMatches(memberId, osmData?.geojson ?? null);

  if (nodeId.startsWith("land-")) {
    const siteId = nodeId.replace("land-", "");
    return matches.find((m) => m.kind === "land" && m.landSiteId === siteId) ?? null;
  }

  if (nodeId.startsWith("osm-")) {
    const featureId = nodeId.replace("osm-", "");
    return matches.find((m) => m.kind === "osm" && m.osmFeatureId === featureId) ?? null;
  }

  if (nodeId.startsWith("member-")) {
    const peerId = nodeId.replace("member-", "");
    return matches.find((m) => m.kind === "peer" && m.peerMemberId === peerId) ?? null;
  }

  const preview = resolveMatchingNodePreview(nodeId, graph, osmData);
  if (!preview) return null;

  return {
    id: `graph-${nodeId}`,
    kind: "osm" as const,
    priority: "medium",
    title: preview.title,
    detail: preview.subtitle ?? preview.detail ?? "Corridor context — explore on map",
    cta: "View on map",
    tab: "junqingchu",
    score: 55,
    center: preview.center
  };
}
