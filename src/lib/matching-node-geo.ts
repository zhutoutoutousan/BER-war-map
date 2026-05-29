import { getBerLandSiteById } from "@/data/ber-land-sites";
import { getMitgliedById } from "@/data/mitglieder";
import type { CorridorGraph, GraphNode } from "@/lib/member-asset-graph";
import { CORRIDOR_BBOX } from "@/lib/graph-layout";
import { findOsmIntelFeatureForPopup } from "@/lib/osm-intel-lookup";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";

export type MatchingNodePreview = {
  title: string;
  subtitle?: string;
  detail?: string;
  center: [number, number];
  zoom: number;
  feature?: GeoJSON.Feature;
  /** Pass-through for opening the full war-room map */
  nodeId: string;
};

function graphNode(graph: CorridorGraph, nodeId: string): GraphNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

function canvasToLngLat(x: number, y: number, graph: CorridorGraph): [number, number] {
  const pad = 100;
  const tLng = (x - pad) / (graph.width - pad * 2);
  const tLat = (y - pad) / (graph.height - pad * 2);
  const lng =
    CORRIDOR_BBOX.minLng + Math.max(0, Math.min(1, tLng)) * (CORRIDOR_BBOX.maxLng - CORRIDOR_BBOX.minLng);
  const lat =
    CORRIDOR_BBOX.maxLat - Math.max(0, Math.min(1, tLat)) * (CORRIDOR_BBOX.maxLat - CORRIDOR_BBOX.minLat);
  return [lng, lat];
}

export function resolveMatchingNodePreview(
  nodeId: string,
  graph: CorridorGraph,
  osmData: OsmIntelPayload | null
): MatchingNodePreview | null {
  const node = graphNode(graph, nodeId);
  if (!node) return null;

  if (nodeId.startsWith("land-")) {
    const siteId = node.landSiteId ?? nodeId.replace("land-", "");
    const site = getBerLandSiteById(siteId);
    if (!site) {
      return {
        nodeId,
        title: node.label,
        subtitle: node.sublabel,
        center: canvasToLngLat(node.x, node.y, graph),
        zoom: 13.2
      };
    }
    return {
      nodeId,
      title: site.name,
      subtitle: `${site.areaHa} ha · ${site.status}`,
      detail: site.berPlusRole,
      center: site.coordinates,
      zoom: 14,
      feature: {
        type: "Feature",
        properties: { id: site.id },
        geometry: { type: "Point", coordinates: site.coordinates }
      }
    };
  }

  if (nodeId.startsWith("osm-")) {
    const featureId = node.osmFeatureId ?? nodeId.replace("osm-", "");
    const picked = osmData
      ? findOsmIntelFeatureForPopup(osmData.geojson, osmData.iconGeojson, featureId, null)
      : null;
    if (picked) {
      return {
        nodeId,
        title: picked.props.name,
        subtitle: `${picked.props.category} / ${picked.props.subcategory}`,
        detail: picked.props.tagsSummary,
        center: picked.coordinates,
        zoom: 14.2,
        feature: picked.feature
      };
    }
    return {
      nodeId,
      title: node.label,
      subtitle: node.sublabel,
      center: canvasToLngLat(node.x, node.y, graph),
      zoom: 13.5
    };
  }

  if (nodeId === "hub-ber") {
    const center: [number, number] = [13.51, 52.366];
    return {
      nodeId,
      title: node.label,
      subtitle: node.sublabel,
      detail: "Corridor matching hub — BER Flughafenregion",
      center,
      zoom: 12.8,
      feature: {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: center }
      }
    };
  }

  if (nodeId.startsWith("member-")) {
    const memberId = nodeId.replace("member-", "");
    const m = getMitgliedById(memberId);
    if (!m) return null;
    return {
      nodeId,
      title: m.name,
      subtitle: m.corridorRole,
      detail: m.intro.slice(0, 200),
      center: m.coordinates,
      zoom: 12.6,
      feature: {
        type: "Feature",
        properties: { id: memberId },
        geometry: { type: "Point", coordinates: m.coordinates }
      }
    };
  }

  if (nodeId.startsWith("infra-") || nodeId.startsWith("zone-")) {
    const center = canvasToLngLat(node.x, node.y, graph);
    return {
      nodeId,
      title: node.label,
      subtitle: node.sublabel,
      center,
      zoom: 12.4,
      feature: {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: center }
      }
    };
  }

  return {
    nodeId,
    title: node.label,
    subtitle: node.sublabel,
    center: canvasToLngLat(node.x, node.y, graph),
    zoom: 12.5
  };
}
