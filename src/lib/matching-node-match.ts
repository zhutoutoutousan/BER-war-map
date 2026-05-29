import type { CorridorGraph } from "@/lib/member-asset-graph";
import { buildLiveMatches, liveMatchFromOsmFeature, type LiveMatch } from "@/lib/local-member-matching";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";

function findOsmFeature(
  geojson: GeoJSON.FeatureCollection | null | undefined,
  featureId: string
): GeoJSON.Feature | undefined {
  if (!geojson) return undefined;
  return geojson.features.find((f) => (f.properties as OsmIntelFeatureProperties).id === featureId);
}

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
    const fromQueue = matches.find((m) => m.kind === "osm" && m.osmFeatureId === featureId);
    if (fromQueue) return fromQueue;
    const f = findOsmFeature(osmData?.geojson ?? null, featureId);
    if (f) return liveMatchFromOsmFeature(f, memberId);
    return null;
  }

  if (nodeId.startsWith("member-")) {
    const peerId = nodeId.replace("member-", "");
    return matches.find((m) => m.kind === "peer" && m.peerMemberId === peerId) ?? null;
  }

  return null;
}
