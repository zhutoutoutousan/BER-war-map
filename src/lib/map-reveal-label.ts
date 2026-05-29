import { getBerLandSiteById } from "@/data/ber-land-sites";
import { findOsmIntelFeatureForPopup } from "@/lib/osm-intel-lookup";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";

export function labelForSelectedFeature(featureId: string, data: OsmIntelPayload | null): string {
  if (featureId.startsWith("curated/")) {
    return getBerLandSiteById(featureId.slice("curated/".length))?.name ?? "BER+ land";
  }
  if (!data) return "OSM asset";
  const picked = findOsmIntelFeatureForPopup(data.geojson, data.iconGeojson, featureId, null);
  return picked?.props.name ?? "OSM asset";
}
