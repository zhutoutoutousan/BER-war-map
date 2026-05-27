import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";

export type OsmIntelPickResult = {
  feature: GeoJSON.Feature;
  props: OsmIntelFeatureProperties;
  coordinates: [number, number];
};

function ringCentroid(ring: [number, number][]): [number, number] | null {
  if (!ring.length) return null;
  let lng = 0;
  let lat = 0;
  for (const c of ring) {
    lng += c[0];
    lat += c[1];
  }
  return [lng / ring.length, lat / ring.length];
}

export function centroidOf(geom: GeoJSON.Geometry): [number, number] | null {
  if (geom.type === "Point") return geom.coordinates as [number, number];
  if (geom.type === "Polygon") return ringCentroid(geom.coordinates[0] as [number, number][]);
  if (geom.type === "MultiPolygon") {
    let lng = 0;
    let lat = 0;
    let n = 0;
    for (const poly of geom.coordinates) {
      const c = ringCentroid(poly[0] as [number, number][]);
      if (!c) continue;
      lng += c[0];
      lat += c[1];
      n += 1;
    }
    return n ? ([lng / n, lat / n] as [number, number]) : null;
  }
  if (geom.type === "LineString") return ringCentroid(geom.coordinates as [number, number][]);
  return null;
}

/** Fallback when React geojson is out of sync with the map source */
export function findOsmIntelFeatureFromMapSource(
  map: import("maplibre-gl").Map,
  featureId: string,
  clickLngLat?: [number, number] | null
): OsmIntelPickResult | null {
  const hits = map.querySourceFeatures("ber-osm-intel", {
    filter: ["==", ["get", "id"], featureId]
  });
  const main = hits[0];
  if (!main?.properties || !main.geometry) return null;
  const props = main.properties as OsmIntelFeatureProperties;
  const coords = clickLngLat ?? centroidOf(main.geometry);
  if (!coords) return null;
  return { feature: main, props, coordinates: coords };
}

/** Resolve OSM intel feature + popup anchor (icon point preferred). */
export function findOsmIntelFeatureForPopup(
  geo: GeoJSON.FeatureCollection | null | undefined,
  iconGeo: GeoJSON.FeatureCollection | null | undefined,
  featureId: string,
  clickLngLat?: [number, number] | null
): OsmIntelPickResult | null {
  if (clickLngLat) {
    const main = geo?.features.find((f) => f.properties?.id === featureId);
    if (main?.properties) {
      return {
        feature: main,
        props: main.properties as OsmIntelFeatureProperties,
        coordinates: clickLngLat
      };
    }
  }

  const icon = iconGeo?.features.find((f) => f.properties?.id === featureId);
  if (icon?.geometry?.type === "Point") {
    const main = geo?.features.find((f) => f.properties?.id === featureId);
    const props = (main?.properties ?? icon.properties) as OsmIntelFeatureProperties;
    return {
      feature: main ?? icon,
      props,
      coordinates: icon.geometry.coordinates as [number, number]
    };
  }

  const main = geo?.features.find((f) => f.properties?.id === featureId);
  if (!main?.geometry || !main.properties) return null;

  const coords = clickLngLat ?? centroidOf(main.geometry);
  if (!coords) return null;

  return {
    feature: main,
    props: main.properties as OsmIntelFeatureProperties,
    coordinates: coords
  };
}
