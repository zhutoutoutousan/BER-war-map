import type { Map as MapLibreMap } from "maplibre-gl";
import berAirport from "@/data/ber-airport.json";
import corridorLabels from "@/data/corridor-labels.json";
import type { CctvMapProperties } from "@/lib/cctv-geojson";
import { applyBasemapLabelGlow } from "./map-label-glow";

const EMPTY_CCTV: GeoJSON.FeatureCollection<GeoJSON.Point, CctvMapProperties> = {
  type: "FeatureCollection",
  features: []
};

function getMapFonts(map: MapLibreMap): string[] {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== "symbol") continue;
    const fonts = (layer.layout as Record<string, unknown> | undefined)?.["text-font"];
    if (Array.isArray(fonts) && fonts.length) return fonts as string[];
  }
  return ["Open Sans Regular", "Arial Unicode MS Regular"];
}

export function setupWarRoomOverlays(
  map: MapLibreMap,
  corridorGeo: GeoJSON.FeatureCollection,
  membersGeo: GeoJSON.FeatureCollection
) {
  if (map.getSource("ber-corridor")) return;

  applyBasemapLabelGlow(map);
  const fonts = getMapFonts(map);

  map.addSource("ber-airport", { type: "geojson", data: berAirport as GeoJSON.FeatureCollection });
  map.addSource("corridor-labels", {
    type: "geojson",
    data: corridorLabels as GeoJSON.FeatureCollection
  });
  map.addSource("ber-corridor", { type: "geojson", data: corridorGeo });
  map.addSource("ber-members", { type: "geojson", data: membersGeo });

  // —— BER airport highlight ——
  map.addLayer({
    id: "ber-airport-fill-glow",
    type: "fill",
    source: "ber-airport",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": "rgba(56, 189, 248, 0.22)",
      "fill-opacity": 0.55
    }
  });

  map.addLayer({
    id: "ber-airport-fill",
    type: "fill",
    source: "ber-airport",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": "rgba(14, 165, 233, 0.35)",
      "fill-opacity": 0.4
    }
  });

  map.addLayer({
    id: "ber-airport-outline-glow",
    type: "line",
    source: "ber-airport",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": "rgba(56, 189, 248, 0.45)",
      "line-width": 8,
      "line-blur": 4
    }
  });

  map.addLayer({
    id: "ber-airport-outline",
    type: "line",
    source: "ber-airport",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": "rgba(125, 211, 252, 0.95)",
      "line-width": 2.5
    }
  });

  // —— Corridor ——
  map.addLayer({
    id: "corridor-glow",
    type: "line",
    source: "ber-corridor",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "rgba(56, 189, 248, 0.3)",
      "line-width": 16,
      "line-blur": 2
    }
  });

  map.addLayer({
    id: "corridor-line",
    type: "line",
    source: "ber-corridor",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "rgba(56, 189, 248, 0.95)",
      "line-width": 4,
      "line-blur": 0.3
    }
  });

  // —— Glowing place / road labels (custom) ——
  map.addLayer({
    id: "place-label-glow",
    type: "symbol",
    source: "corridor-labels",
    filter: ["==", ["geometry-type"], "Point"],
    layout: {
      "text-field": ["get", "name"],
      "text-font": fonts,
      "text-size": [
        "match",
        ["get", "size"],
        "xl",
        20,
        "lg",
        16,
        "md",
        13,
        11
      ],
      "text-anchor": "center",
      "text-offset": [0, 0.6],
      "text-letter-spacing": 0.04
    },
    paint: {
      "text-color": "rgba(56, 189, 248, 0.35)",
      "text-halo-color": "rgba(56, 189, 248, 0.9)",
      "text-halo-width": 4,
      "text-halo-blur": 1.4
    }
  });

  map.addLayer({
    id: "place-label",
    type: "symbol",
    source: "corridor-labels",
    filter: ["==", ["geometry-type"], "Point"],
    layout: {
      "text-field": ["get", "name"],
      "text-font": fonts,
      "text-size": [
        "match",
        ["get", "size"],
        "xl",
        18,
        "lg",
        14,
        "md",
        12,
        10
      ],
      "text-anchor": "center",
      "text-offset": [0, 0.6]
    },
    paint: {
      "text-color": [
        "match",
        ["get", "kind"],
        "road",
        "rgba(251, 191, 36, 0.95)",
        "corridor",
        "rgba(125, 211, 252, 0.9)",
        "rgba(240, 249, 255, 0.95)"
      ],
      "text-halo-color": "rgba(6, 8, 12, 0.85)",
      "text-halo-width": 1.2
    }
  });

  // BER main label (from airport geojson)
  map.addLayer({
    id: "ber-label-glow",
    type: "symbol",
    source: "ber-airport",
    filter: ["==", ["get", "id"], "ber-airport-label"],
    layout: {
      "text-field": ["get", "name"],
      "text-font": fonts,
      "text-size": 22,
      "text-anchor": "center"
    },
    paint: {
      "text-color": "rgba(56, 189, 248, 0.4)",
      "text-halo-color": "rgba(56, 189, 248, 1)",
      "text-halo-width": 5,
      "text-halo-blur": 1.6
    }
  });

  map.addLayer({
    id: "ber-label",
    type: "symbol",
    source: "ber-airport",
    filter: ["==", ["get", "id"], "ber-airport-label"],
    layout: {
      "text-field": ["concat", ["get", "name"], "\n", ["get", "subtitle"]],
      "text-font": fonts,
      "text-size": 14,
      "text-anchor": "center",
      "text-line-height": 1.2
    },
    paint: {
      "text-color": "#f0f9ff",
      "text-halo-color": "rgba(14, 165, 233, 0.85)",
      "text-halo-width": 2
    }
  });

  // —— Pilot-1 ——
  map.addLayer({
    id: "pilot-halo",
    type: "circle",
    source: "ber-corridor",
    filter: ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "id"], "pilot-1"]],
    paint: {
      "circle-radius": 24,
      "circle-color": "rgba(16, 185, 129, 0.2)",
      "circle-blur": 0.5
    }
  });

  map.addLayer({
    id: "pilot-point",
    type: "circle",
    source: "ber-corridor",
    filter: ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "id"], "pilot-1"]],
    paint: {
      "circle-radius": 9,
      "circle-color": "rgba(16, 185, 129, 0.95)",
      "circle-stroke-color": "rgba(255,255,255,0.85)",
      "circle-stroke-width": 2
    }
  });

  // —— Members ——
  map.addLayer({
    id: "member-halo",
    type: "circle",
    source: "ber-members",
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 18, 12],
      "circle-color": ["get", "color"],
      "circle-opacity": 0.25,
      "circle-blur": 0.4
    }
  });

  map.addLayer({
    id: "member-point",
    type: "circle",
    source: "ber-members",
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 9, 6],
      "circle-color": ["get", "color"],
      "circle-stroke-color": "rgba(255,255,255,0.9)",
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.5, 1.5]
    }
  });

  setupCctvLayers(map, EMPTY_CCTV);
}

export function setupCctvLayers(
  map: MapLibreMap,
  cctvGeo: GeoJSON.FeatureCollection<GeoJSON.Point, CctvMapProperties>
) {
  if (map.getSource("ber-cctv")) {
    updateCctvGeo(map, cctvGeo);
    return;
  }

  map.addSource("ber-cctv", {
    type: "geojson",
    data: cctvGeo,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 42
  });

  map.addLayer({
    id: "cctv-cluster-glow",
    type: "circle",
    source: "ber-cctv",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "rgba(244, 114, 182, 0.25)",
      "circle-radius": ["step", ["get", "point_count"], 14, 20, 18, 100, 24]
    }
  });

  map.addLayer({
    id: "cctv-cluster",
    type: "circle",
    source: "ber-cctv",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#f472b6", 20, "#e879f9", 100, "#c084fc"],
      "circle-radius": ["step", ["get", "point_count"], 10, 20, 14, 100, 18],
      "circle-stroke-color": "rgba(255,255,255,0.85)",
      "circle-stroke-width": 1.5
    }
  });

  map.addLayer({
    id: "cctv-cluster-count",
    type: "symbol",
    source: "ber-cctv",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": getMapFonts(map),
      "text-size": 11
    },
    paint: {
      "text-color": "#fff"
    }
  });

  map.addLayer({
    id: "cctv-halo",
    type: "circle",
    source: "ber-cctv",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 12, 8],
      "circle-color": ["get", "color"],
      "circle-opacity": 0.3,
      "circle-blur": 0.35
    }
  });

  map.addLayer({
    id: "cctv-point",
    type: "circle",
    source: "ber-cctv",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 7, 4.5],
      "circle-color": ["get", "color"],
      "circle-stroke-color": "rgba(255,255,255,0.9)",
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 2, 1]
    }
  });
}

export function updateCctvGeo(
  map: MapLibreMap,
  cctvGeo: GeoJSON.FeatureCollection<GeoJSON.Point, CctvMapProperties>
) {
  const src = map.getSource("ber-cctv") as import("maplibre-gl").GeoJSONSource | undefined;
  src?.setData(cctvGeo);
}

const CCTV_INTERACTIONS_KEY = "__berCctvInteractionsBound__";

export function bindCctvInteractions(
  map: MapLibreMap,
  onSelectCctv: (id: string | null) => void
) {
  const tagged = map as MapLibreMap & { [CCTV_INTERACTIONS_KEY]?: boolean };
  if (tagged[CCTV_INTERACTIONS_KEY]) return;
  tagged[CCTV_INTERACTIONS_KEY] = true;

  map.on("click", "cctv-cluster", async (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["cctv-cluster"] });
    const clusterId = features[0]?.properties?.cluster_id;
    if (clusterId == null) return;
    const src = map.getSource("ber-cctv") as import("maplibre-gl").GeoJSONSource;
    const zoom = await src.getClusterExpansionZoom(clusterId);
    map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
  });

  map.on("click", "cctv-point", (e) => {
    const id = e.features?.[0]?.properties?.id;
    if (typeof id === "string") onSelectCctv(id);
  });

  for (const layer of ["cctv-point", "cctv-cluster"] as const) {
    map.on("mouseenter", layer, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

const INTERACTIONS_KEY = "__berMapInteractionsBound__";

export function bindMapInteractions(
  map: MapLibreMap,
  onSelectMember: (id: string | null) => void
) {
  const tagged = map as MapLibreMap & { [INTERACTIONS_KEY]?: boolean };
  if (tagged[INTERACTIONS_KEY]) return;
  tagged[INTERACTIONS_KEY] = true;

  const clickMember = (e: import("maplibre-gl").MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.id;
    if (typeof id === "string") onSelectMember(id);
  };

  const clickPilot = (e: import("maplibre-gl").MapLayerMouseEvent) => {
    e.originalEvent.stopPropagation();
    onSelectMember("segro");
  };

  map.on("click", "member-point", clickMember);
  map.on("click", "pilot-point", clickPilot);
  map.on("mouseenter", "member-point", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "member-point", () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", "pilot-point", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "pilot-point", () => {
    map.getCanvas().style.cursor = "";
  });
}
