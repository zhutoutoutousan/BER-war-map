import type { Map as MapLibreMap } from "maplibre-gl";
import berAirport from "@/data/ber-airport.json";
import corridorLabels from "@/data/corridor-labels.json";
import type { CctvMapProperties } from "@/lib/cctv-geojson";
import { OSM_INTEL_CATEGORIES } from "@/lib/osm-intel-categories";
import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";
import { corridorZoneToGeoJSON } from "@/lib/corridor-zone-geojson";
import { landAnchorLabelsToGeoJSON, landAnchorsToGeoJSON, POLYGON_ONLY_CATEGORIES } from "@/lib/land-anchors-geojson";
import { memberZoneLabelsToGeoJSON, memberZonesToGeoJSON } from "@/lib/member-zones-geojson";
import { buildInfraIconGeoJSON } from "@/lib/osm-infra-icons";
import {
  osmTrace,
  osmTraceClick,
  isOsmMapTraceEnabled,
  osmTraceMapSnapshot,
  osmTraceSkip,
  osmTraceVisibility,
  osmTraceWarn
} from "@/lib/osm-map-trace";
import { applyBasemapLabelGlow } from "./map-label-glow";

const EMPTY_OSM_INTEL: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const EMPTY_OSM_ICONS: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: [] };

const INFRA_ICON_CATEGORIES = OSM_INTEL_CATEGORIES.filter((c) => c.id !== "land");

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

export function warRoomOverlaysReady(map: MapLibreMap) {
  return Boolean(map.getSource("ber-corridor") && map.getLayer("osm-intel-industry-fill"));
}

export function setupWarRoomOverlays(
  map: MapLibreMap,
  corridorGeo: GeoJSON.FeatureCollection,
  membersGeo: GeoJSON.FeatureCollection
) {
  visibilityCache.delete(map);
  if (warRoomOverlaysReady(map)) {
    osmTraceSkip("setupWarRoomOverlays", "already ready");
    return;
  }

  if (map.getSource("ber-corridor")) {
    osmTrace("setupWarRoomOverlays", "partial repair — corridor exists, OSM layers missing");
    setupMemberZoneLayers(map);
    setupOsmIntelLayers(map, EMPTY_OSM_INTEL, EMPTY_OSM_ICONS);
    setupLandAnchorLayers(map);
    positionIconHitsForClicks(map);
    osmTraceMapSnapshot(map, "after partial repair");
    return;
  }

  osmTrace("setupWarRoomOverlays", "full init");

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

  // —— BER+ Corridor ribbon + spine ——
  map.addSource("ber-corridor-zone", { type: "geojson", data: corridorZoneToGeoJSON() });

  map.addLayer({
    id: "corridor-zone-fill",
    type: "fill",
    source: "ber-corridor-zone",
    paint: {
      "fill-color": "rgba(56, 189, 248, 0.12)",
      "fill-opacity": 0.85
    }
  });

  map.addLayer({
    id: "corridor-zone-outline",
    type: "line",
    source: "ber-corridor-zone",
    paint: {
      "line-color": "rgba(125, 211, 252, 0.35)",
      "line-width": 1.5,
      "line-dasharray": [4, 3]
    }
  });

  map.addLayer({
    id: "corridor-outer-glow",
    type: "line",
    source: "ber-corridor",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "rgba(56, 189, 248, 0.22)",
      "line-width": 26,
      "line-blur": 4
    }
  });

  map.addLayer({
    id: "corridor-glow",
    type: "line",
    source: "ber-corridor",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "rgba(56, 189, 248, 0.45)",
      "line-width": 14,
      "line-blur": 2
    }
  });

  map.addLayer({
    id: "corridor-line",
    type: "line",
    source: "ber-corridor",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "#7dd3fc",
      "line-width": 5,
      "line-opacity": 1
    }
  });

  map.addLayer({
    id: "corridor-line-label",
    type: "symbol",
    source: "ber-corridor",
    filter: ["==", ["geometry-type"], "LineString"],
    layout: {
      "symbol-placement": "line",
      "text-field": ["coalesce", ["get", "name"], "BER+ Corridor"],
      "text-font": fonts,
      "text-size": 13,
      "text-letter-spacing": 0.06,
      "text-max-angle": 30,
      "text-optional": true
    },
    paint: {
      "text-color": "#e0f2fe",
      "text-halo-color": "rgba(2, 6, 23, 0.92)",
      "text-halo-width": 2.5
    },
    minzoom: 10
  });

  // —— Key place labels only (no small roads / duplicate corridor tag) ——
  const PLACE_LABEL_FILTER: import("maplibre-gl").FilterSpecification = [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["in", ["get", "size"], ["literal", ["lg", "md"]]],
    ["!=", ["get", "kind"], "road"],
    ["!=", ["get", "id"], "ber-corridor-tag"]
  ];

  map.addLayer({
    id: "place-label-glow",
    type: "symbol",
    source: "corridor-labels",
    filter: PLACE_LABEL_FILTER,
    minzoom: 10,
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
    filter: PLACE_LABEL_FILTER,
    minzoom: 10,
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

  setupMemberZoneLayers(map);
  setupOsmIntelLayers(map, EMPTY_OSM_INTEL, EMPTY_OSM_ICONS);
  setupLandAnchorLayers(map);

  // —— Members ——
  map.addLayer({
    id: "member-halo",
    type: "circle",
    source: "ber-members",
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 22, 14],
      "circle-color": ["get", "color"],
      "circle-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.45, 0.28],
      "circle-blur": 0.35
    }
  });

  map.addLayer({
    id: "member-point",
    type: "circle",
    source: "ber-members",
    paint: {
      "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 10, 7],
      "circle-color": ["get", "color"],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 2]
    }
  });

  setupCctvLayers(map, EMPTY_CCTV);
  positionIconHitsForClicks(map);
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

/** @deprecated Handled by bindWarRoomMapClicks */
export function bindCctvInteractions(_map: MapLibreMap, _onSelectCctv: (id: string | null) => void) {}

function setupInfraIconLayers(map: MapLibreMap, iconGeo: GeoJSON.FeatureCollection<GeoJSON.Point>) {
  const existing = map.getSource("ber-osm-intel-icons") as import("maplibre-gl").GeoJSONSource | undefined;
  if (existing) {
    existing.setData(iconGeo);
  } else {
    map.addSource("ber-osm-intel-icons", { type: "geojson", data: iconGeo });
  }

  const fonts = getMapFonts(map);

  for (const cat of INFRA_ICON_CATEGORIES) {
    const minzoom = cat.id === "aeroway" ? 11.5 : cat.id === "industry" ? 11 : 10.5;
    const hitId = `osm-intel-icon-hit-${cat.id}`;
    if (!map.getLayer(hitId)) {
      map.addLayer({
        id: hitId,
        type: "circle",
        source: "ber-osm-intel-icons",
        filter: ["==", ["get", "category"], cat.id],
        minzoom,
        paint: {
          "circle-radius": 18,
          "circle-color": "#000000",
          "circle-opacity": 0.01,
          "circle-stroke-width": 0
        }
      });
    }

    const symId = `osm-intel-icon-${cat.id}`;
    if (map.getLayer(symId)) continue;

    map.addLayer({
      id: symId,
      type: "symbol",
      source: "ber-osm-intel-icons",
      filter: ["==", ["get", "category"], cat.id],
      minzoom,
      layout: {
        "text-field": ["get", "iconGlyph"],
        "text-font": fonts,
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-optional": true
      },
      paint: {
        "text-color": [
          "case",
          ["get", "memberLinked"],
          "#fde68a",
          ["coalesce", ["get", "iconColor"], "#94a3b8"]
        ],
        "text-halo-color": "rgba(2, 6, 23, 0.92)",
        "text-halo-width": 2.2
      }
    });
  }
}

/** Icon hit targets above OSM highlights, below member/CCTV (clickable) */
export function positionIconHitsForClicks(map: MapLibreMap) {
  const beforeId = map.getLayer("member-halo")
    ? "member-halo"
    : map.getLayer("member-point")
      ? "member-point"
      : map.getLayer("cctv-point")
        ? "cctv-point"
        : null;
  if (!beforeId) return;
  for (const cat of INFRA_ICON_CATEGORIES) {
    const hitId = `osm-intel-icon-hit-${cat.id}`;
    if (map.getLayer(hitId)) {
      map.moveLayer(hitId, beforeId);
    }
  }
}

function addOsmIntelLayerStack(
  map: MapLibreMap,
  iconGeo: GeoJSON.FeatureCollection<GeoJSON.Point>
) {
  if (map.getLayer("osm-intel-industry-fill")) {
    osmTraceSkip("addOsmIntelLayerStack", "layers already present");
    return;
  }

  osmTrace("addOsmIntelLayerStack", "adding OSM fill/line/icon layers");

  for (const cat of OSM_INTEL_CATEGORIES) {
    const base = `osm-intel-${cat.id}`;
    const color = cat.color;

    map.addLayer({
      id: `${base}-fill`,
      type: "fill",
      source: "ber-osm-intel",
      filter: ["all", ["==", ["get", "category"], cat.id], ["==", ["get", "geomType"], "polygon"]],
      paint: {
        "fill-color": [
          "case",
          ["get", "memberLinked"],
          "#fbbf24",
          color
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.65,
          ["get", "memberLinked"],
          0.52,
          ["==", ["get", "category"], "land"],
          0.5,
          ["==", ["get", "category"], "industry"],
          0.38,
          0.28
        ],
        "fill-outline-color": ["case", ["get", "memberLinked"], "#fde68a", color]
      }
    });

    map.addLayer({
      id: `${base}-line`,
      type: "line",
      source: "ber-osm-intel",
      filter: ["all", ["==", ["get", "category"], cat.id], ["==", ["get", "geomType"], "line"]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["case", ["get", "memberLinked"], "#fbbf24", color],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          3.5,
          ["get", "memberLinked"],
          3,
          ["==", ["get", "category"], "transport"],
          2.5,
          1.5
        ],
        "line-opacity": ["case", ["get", "memberLinked"], 1, 0.85]
      }
    });

    if (!POLYGON_ONLY_CATEGORIES.has(cat.id)) {
      map.addLayer({
        id: `${base}-point`,
        type: "circle",
        source: "ber-osm-intel",
        filter: ["all", ["==", ["get", "category"], cat.id], ["==", ["get", "geomType"], "point"]],
        paint: {
          "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 8, 5],
          "circle-color": color,
          "circle-stroke-color": "rgba(255,255,255,0.9)",
          "circle-stroke-width": 1.5
        }
      });
    }
  }

  map.addLayer({
    id: "osm-intel-land-highlight",
    type: "line",
    source: "ber-osm-intel",
    filter: [
      "all",
      ["==", ["get", "category"], "land"],
      ["==", ["get", "geomType"], "polygon"]
    ],
    paint: {
      "line-color": "#6ee7b7",
      "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 0],
      "line-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 1, 0]
    }
  });

  setupInfraIconLayers(map, iconGeo);

  map.addLayer({
    id: "osm-intel-member-super-fill",
    type: "fill",
    source: "ber-osm-intel",
    filter: [
      "all",
      ["==", ["get", "memberLinked"], true],
      ["==", ["get", "geomType"], "polygon"]
    ],
    paint: {
      "fill-color": "#f59e0b",
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.72,
        0.58
      ]
    }
  });

  map.addLayer({
    id: "osm-intel-member-super-line",
    type: "line",
    source: "ber-osm-intel",
    filter: [
      "all",
      ["==", ["get", "memberLinked"], true],
      ["==", ["get", "geomType"], "line"]
    ],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#fcd34d",
      "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 6, 4.5],
      "line-blur": 1.5,
      "line-opacity": 0.95
    }
  });

  map.addLayer({
    id: "osm-intel-member-outline",
    type: "line",
    source: "ber-osm-intel",
    filter: [
      "all",
      ["==", ["get", "memberLinked"], true],
      ["==", ["get", "geomType"], "polygon"]
    ],
    paint: {
      "line-color": "#fffbeb",
      "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 4, 3],
      "line-dasharray": [2, 1]
    }
  });
}

export function setupOsmIntelLayers(
  map: MapLibreMap,
  geo: GeoJSON.FeatureCollection,
  iconGeo: GeoJSON.FeatureCollection<GeoJSON.Point> = EMPTY_OSM_ICONS
) {
  if (map.getSource("ber-osm-intel")) {
    osmTrace("setupOsmIntelLayers", "source exists — update geo", {
      features: geo.features.length,
      icons: iconGeo.features.length
    });
    updateOsmIntelGeo(map, geo, iconGeo);
    if (!map.getLayer("osm-intel-industry-fill")) {
      addOsmIntelLayerStack(map, iconGeo);
    }
    return;
  }

  osmTrace("setupOsmIntelLayers", "create source + layers", {
    features: geo.features.length,
    icons: iconGeo.features.length
  });
  map.addSource("ber-osm-intel", { type: "geojson", data: geo });
  addOsmIntelLayerStack(map, iconGeo);
}

/** Mitglieder influence zones (proximity / corridor sector) */
export function setupMemberZoneLayers(map: MapLibreMap) {
  if (map.getSource("ber-member-zones")) return;

  const zones = memberZonesToGeoJSON();
  const labels = memberZoneLabelsToGeoJSON();
  const fonts = getMapFonts(map);

  map.addSource("ber-member-zones", { type: "geojson", data: zones });
  map.addSource("ber-member-zone-labels", { type: "geojson", data: labels });

  map.addLayer({
    id: "member-zone-outer-glow",
    type: "fill",
    source: "ber-member-zones",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.28,
        ["boolean", ["feature-state", "active"], false],
        0.16,
        0.08
      ]
    }
  });

  map.addLayer({
    id: "member-zone-fill",
    type: "fill",
    source: "ber-member-zones",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        0.38,
        ["boolean", ["feature-state", "active"], false],
        0.22,
        0.12
      ]
    }
  });

  map.addLayer({
    id: "member-zone-outline",
    type: "line",
    source: "ber-member-zones",
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3.5, 2],
      "line-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 1, 0.75],
      "line-dasharray": [3, 2]
    }
  });

  map.addLayer({
    id: "member-zone-label",
    type: "symbol",
    source: "ber-member-zone-labels",
    minzoom: 12,
    layout: {
      "text-field": ["get", "shortName"],
      "text-font": fonts,
      "text-size": 10,
      "text-anchor": "center",
      "text-letter-spacing": 0.04,
      "text-optional": true,
      "text-allow-overlap": false
    },
    paint: {
      "text-color": "#fffbeb",
      "text-halo-color": "rgba(2, 6, 23, 0.9)",
      "text-halo-width": 1.8
    }
  });

  for (const f of zones.features) {
    if (f.id != null) {
      map.setFeatureState({ source: "ber-member-zones", id: f.id }, { active: true, selected: false });
    }
  }
}

export function setMemberZoneHighlight(map: MapLibreMap, memberId: string | null) {
  if (!map.getSource("ber-member-zones")) return;
  const features = map.querySourceFeatures("ber-member-zones");
  for (const f of features) {
    if (f.id == null) continue;
    const active = !memberId || f.properties?.id === memberId;
    map.setFeatureState(
      { source: "ber-member-zones", id: f.id },
      { active, selected: f.properties?.id === memberId }
    );
  }
}

/** BER+ land zones — polygon blocks (not point circles) */
export function setupLandAnchorLayers(map: MapLibreMap) {
  if (map.getSource("ber-land-anchors")) return;

  const zones = landAnchorsToGeoJSON();
  const labels = landAnchorLabelsToGeoJSON();
  const fonts = getMapFonts(map);

  map.addSource("ber-land-anchors", { type: "geojson", data: zones });
  map.addSource("ber-land-anchor-labels", { type: "geojson", data: labels });

  map.addLayer({
    id: "land-anchor-zone-fill",
    type: "fill",
    source: "ber-land-anchors",
    paint: {
      "fill-color": [
        "match",
        ["get", "status"],
        "confirmed",
        "rgba(52, 211, 153, 0.42)",
        "planned",
        "rgba(52, 211, 153, 0.28)",
        "rgba(167, 243, 208, 0.22)"
      ],
      "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.55, 0.38]
    }
  });

  map.addLayer({
    id: "land-anchor-zone-outline",
    type: "line",
    source: "ber-land-anchors",
    paint: {
      "line-color": "#34d399",
      "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 2],
      "line-dasharray": [2, 1]
    }
  });

  map.addLayer({
    id: "land-anchor-label",
    type: "symbol",
    source: "ber-land-anchor-labels",
    minzoom: 11.5,
    layout: {
      "text-field": ["get", "name"],
      "text-font": fonts,
      "text-size": 10,
      "text-anchor": "center",
      "text-max-width": 14,
      "text-optional": true,
      "text-allow-overlap": false
    },
    paint: {
      "text-color": "#ecfdf5",
      "text-halo-color": "rgba(6, 20, 12, 0.9)",
      "text-halo-width": 1.5
    }
  });
}

export function updateOsmIntelGeo(
  map: MapLibreMap,
  geo: GeoJSON.FeatureCollection,
  iconGeo?: GeoJSON.FeatureCollection<GeoJSON.Point>
) {
  const icons = iconGeo ?? buildInfraIconGeoJSON(geo.features);
  const src = map.getSource("ber-osm-intel") as import("maplibre-gl").GeoJSONSource | undefined;
  if (src) {
    osmTrace("updateOsmIntelGeo", "setData", {
      features: geo.features.length,
      icons: icons.features.length,
      hasIndustryFill: Boolean(map.getLayer("osm-intel-industry-fill"))
    });
    src.setData(geo);
    const iconSrc = map.getSource("ber-osm-intel-icons") as import("maplibre-gl").GeoJSONSource | undefined;
    if (iconSrc) iconSrc.setData(icons);
    else setupInfraIconLayers(map, icons);
    if (!map.getLayer("osm-intel-industry-fill")) {
      osmTraceWarn("updateOsmIntelGeo", "fill layers missing after setData — repairing");
      addOsmIntelLayerStack(map, icons);
    }
    positionIconHitsForClicks(map);
  } else {
    osmTrace("updateOsmIntelGeo", "no source — full setupOsmIntelLayers");
    setupOsmIntelLayers(map, geo, icons);
  }
}

export function syncOsmIntelOnMap(
  map: MapLibreMap,
  geo: GeoJSON.FeatureCollection,
  visible: Record<import("@/lib/osm-intel-categories").OsmIntelCategory, boolean>,
  berTargetsOnly: boolean,
  iconGeo?: GeoJSON.FeatureCollection<GeoJSON.Point>,
  focusMemberId?: string | null
) {
  const t0 = isOsmMapTraceEnabled() ? performance.now() : 0;
  osmTrace("syncOsmIntelOnMap", "start", {
    features: geo.features.length,
    icons: iconGeo?.features.length ?? null,
    berTargetsOnly,
    focusMemberId: focusMemberId ?? null,
    styleLoaded: map.isStyleLoaded()
  });
  updateOsmIntelGeo(map, geo, iconGeo);
  if (!map.getSource("ber-land-anchors")) setupLandAnchorLayers(map);
  applyOsmIntelVisibility(map, visible, berTargetsOnly, focusMemberId);
  osmTraceMapSnapshot(map, "sync complete", {
    featureCount: geo.features.length,
    iconCount: iconGeo?.features.length
  });
  if (t0) {
    const ms = performance.now() - t0;
    if (ms > 48) osmTraceWarn("syncOsmIntelOnMap", "slow sync", { ms: Math.round(ms) });
    else osmTrace("syncOsmIntelOnMap", "done", { ms: Math.round(ms) });
  }
}

const OSM_INTEL_LAYER_IDS = OSM_INTEL_CATEGORIES.flatMap((c) => [
  `osm-intel-${c.id}-fill`,
  `osm-intel-${c.id}-line`,
  `osm-intel-${c.id}-point`
]);

function memberFocusFilter(memberId: string): import("maplibre-gl").FilterSpecification {
  return [
    "any",
    ["==", ["get", "primaryMemberId"], memberId],
    ["in", memberId, ["get", "memberIds"]]
  ];
}

function osmIconLayerFilter(
  catId: OsmIntelCategory,
  berTargetsOnly: boolean,
  focusMemberId?: string | null
): import("maplibre-gl").FilterSpecification {
  const parts: import("maplibre-gl").FilterSpecification[] = [["==", ["get", "category"], catId]];
  if (berTargetsOnly) parts.push(["==", ["get", "berRelevant"], true]);
  if (focusMemberId) parts.push(memberFocusFilter(focusMemberId));
  return ["all", ...parts] as import("maplibre-gl").FilterSpecification;
}

const visibilityCache = new WeakMap<MapLibreMap, string>();

function visibilityCacheKey(
  visible: Record<OsmIntelCategory, boolean>,
  berTargetsOnly: boolean,
  focusMemberId?: string | null
): string {
  return JSON.stringify({ visible, berTargetsOnly, focusMemberId: focusMemberId ?? null });
}

export function applyOsmIntelVisibility(
  map: MapLibreMap,
  visible: Record<OsmIntelCategory, boolean>,
  berTargetsOnly: boolean,
  focusMemberId?: string | null
) {
  const key = visibilityCacheKey(visible, berTargetsOnly, focusMemberId);
  if (visibilityCache.get(map) === key && warRoomOverlaysReady(map)) {
    osmTraceSkip("visibility", "unchanged");
    return;
  }
  visibilityCache.set(map, key);

  osmTraceVisibility(visible, berTargetsOnly, focusMemberId);
  for (const cat of OSM_INTEL_CATEGORIES) {
    const show = visible[cat.id] ? "visible" : "none";
    for (const suffix of ["-fill", "-line", "-point"] as const) {
      const id = `osm-intel-${cat.id}${suffix}`;
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", show);
    }
    const iconId = `osm-intel-icon-${cat.id}`;
    if (map.getLayer(iconId)) map.setLayoutProperty(iconId, "visibility", show);
    const hitId = `osm-intel-icon-hit-${cat.id}`;
    if (map.getLayer(hitId)) map.setLayoutProperty(hitId, "visibility", show);
  }

  for (const id of OSM_INTEL_LAYER_IDS) {
    if (!map.getLayer(id)) continue;
    const cat = OSM_INTEL_CATEGORIES.find((c) => id.startsWith(`osm-intel-${c.id}`))!;
    const geom = id.endsWith("-fill") ? "polygon" : id.endsWith("-line") ? "line" : "point";
    const parts: import("maplibre-gl").FilterSpecification[] = [
      ["==", ["get", "category"], cat.id],
      ["==", ["get", "geomType"], geom]
    ];
    if (berTargetsOnly) parts.push(["==", ["get", "berRelevant"], true]);
    if (focusMemberId) parts.push(memberFocusFilter(focusMemberId));
    map.setFilter(id, ["all", ...parts] as import("maplibre-gl").FilterSpecification);
  }

  const memberSuperLayers: { id: string; geom: "polygon" | "line" }[] = [
    { id: "osm-intel-member-super-fill", geom: "polygon" },
    { id: "osm-intel-member-super-line", geom: "line" },
    { id: "osm-intel-member-outline", geom: "polygon" }
  ];
  for (const { id, geom } of memberSuperLayers) {
    if (!map.getLayer(id)) continue;
    const parts: import("maplibre-gl").FilterSpecification[] = [
      ["==", ["get", "memberLinked"], true],
      ["==", ["get", "geomType"], geom]
    ];
    if (focusMemberId) parts.push(memberFocusFilter(focusMemberId));
    map.setFilter(id, ["all", ...parts] as import("maplibre-gl").FilterSpecification);
  }

  setMemberZoneHighlight(map, focusMemberId ?? null);

  if (map.getLayer("osm-intel-land-highlight")) {
    map.setLayoutProperty("osm-intel-land-highlight", "visibility", "visible");
  }

  for (const cat of INFRA_ICON_CATEGORIES) {
    const filter = osmIconLayerFilter(cat.id, berTargetsOnly, focusMemberId);
    const symId = `osm-intel-icon-${cat.id}`;
    const hitId = `osm-intel-icon-hit-${cat.id}`;
    if (map.getLayer(symId)) map.setFilter(symId, filter);
    if (map.getLayer(hitId)) map.setFilter(hitId, filter);
  }
}

const WAR_ROOM_CLICK_KEY = "__berWarRoomClickBound__";

/** Layers that participate in hit-testing (excludes decorative corridor/member zone fills) */
function warRoomQueryLayers(map: MapLibreMap): string[] {
  const osm = [
    ...INFRA_ICON_CATEGORIES.flatMap((c) => [`osm-intel-icon-hit-${c.id}`, `osm-intel-icon-${c.id}`]),
    ...OSM_INTEL_LAYER_IDS,
    "osm-intel-member-super-fill",
    "osm-intel-member-super-line",
    "osm-intel-member-outline",
    "land-anchor-zone-fill",
    "osm-intel-land-fill",
    "osm-intel-industry-fill",
    "osm-intel-aeroway-fill",
    "osm-intel-power-fill",
    "osm-intel-transport-line",
    "osm-intel-utilities-fill"
  ];
  const ui = ["member-point", "pilot-point", "cctv-point", "cctv-cluster"];
  return [...ui, ...osm].filter((id) => map.getLayer(id));
}

function pointFromFeature(f: GeoJSON.Feature): [number, number] | null {
  if (f.geometry?.type === "Point") return f.geometry.coordinates as [number, number];
  return null;
}

const CLICK_PAD_PX = 6;

function queryClickFeatures(map: MapLibreMap, point: { x: number; y: number }, layers: string[]) {
  const pad = CLICK_PAD_PX;
  const box: [[number, number], [number, number]] = [
    [point.x - pad, point.y - pad],
    [point.x + pad, point.y + pad]
  ];
  return map.queryRenderedFeatures(box, { layers });
}

type MapHitFeature = GeoJSON.Feature & { layer?: { id: string } };

function pickOsmFromHits(
  hits: MapHitFeature[]
): { featureId: string; anchor: [number, number] | null; feature: GeoJSON.Feature } | null {
  for (const f of hits) {
    const layerId = f.layer?.id ?? "";
    if (layerId.startsWith("osm-intel-icon-hit") || layerId.startsWith("osm-intel-icon-")) {
      const id = f.properties?.id;
      if (typeof id === "string" && id) {
        return { featureId: id, anchor: pointFromFeature(f), feature: f };
      }
    }
  }

  for (const f of hits) {
    if (f.layer?.id === "land-anchor-zone-fill") {
      const id = f.properties?.id;
      if (typeof id === "string" && id) {
        return { featureId: `curated/${id}`, anchor: null, feature: f };
      }
    }
  }

  for (const f of hits) {
    const layerId = f.layer?.id ?? "";
    if (!layerId.startsWith("osm-intel")) continue;
    if (layerId.startsWith("osm-intel-icon-")) continue;
    const id = f.properties?.id;
    if (typeof id === "string" && id) {
      return { featureId: id, anchor: null, feature: f };
    }
  }

  return null;
}

export type WarRoomClickHandlers = {
  onSelectOsm: (id: string | null, anchor?: [number, number] | null) => void;
  onSelectMember: (id: string | null) => void;
  onSelectCctv: (id: string | null) => void;
};

export function bindWarRoomMapClicks(map: MapLibreMap, handlers: WarRoomClickHandlers) {
  const tagged = map as MapLibreMap & { [WAR_ROOM_CLICK_KEY]?: boolean };
  if (tagged[WAR_ROOM_CLICK_KEY]) return;
  tagged[WAR_ROOM_CLICK_KEY] = true;

  map.on("click", async (e) => {
    const layers = warRoomQueryLayers(map);
    if (!layers.length) {
      osmTraceSkip("click", "no query layers");
      return;
    }

    const hits = queryClickFeatures(map, e.point, layers);
    if (!hits.length) return;

    const clickLngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const hitSummary = hits.map((f) => ({
      layerId: f.layer?.id ?? "?",
      id: typeof f.properties?.id === "string" ? f.properties.id : undefined
    }));

    for (const f of hits) {
      const layerId = f.layer?.id ?? "";

      if (layerId === "member-point") {
        const id = f.properties?.id;
        if (typeof id === "string") handlers.onSelectMember(id);
        return;
      }

      if (layerId === "pilot-point") {
        handlers.onSelectMember("segro");
        return;
      }

      if (layerId === "cctv-point") {
        const id = f.properties?.id;
        if (typeof id === "string") handlers.onSelectCctv(id);
        return;
      }

      if (layerId === "cctv-cluster") {
        const clusterId = f.properties?.cluster_id;
        const src = map.getSource("ber-cctv") as import("maplibre-gl").GeoJSONSource | undefined;
        if (clusterId != null && src) {
          const zoom = await src.getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: (f.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom
          });
        }
        return;
      }
    }

    const osm = pickOsmFromHits(hits);
    osmTraceClick(e.point, layers, hitSummary, osm ? { featureId: osm.featureId } : null);
    if (osm) {
      handlers.onSelectOsm(osm.featureId, osm.anchor ?? clickLngLat);
    }
  });

  map.on("mousemove", (e) => {
    const layers = warRoomQueryLayers(map);
    const hits = layers.length ? queryClickFeatures(map, e.point, layers) : [];
    map.getCanvas().style.cursor = hits.length ? "pointer" : "";
  });
}

/** @deprecated Use bindWarRoomMapClicks */
export function bindOsmIntelInteractions(
  map: MapLibreMap,
  onSelect: (id: string | null, anchor?: [number, number] | null) => void
) {
  bindWarRoomMapClicks(map, {
    onSelectOsm: onSelect,
    onSelectMember: () => {},
    onSelectCctv: () => {}
  });
}

export function setLandAnchorSelected(map: MapLibreMap, siteId: string | null) {
  const features = map.querySourceFeatures("ber-land-anchors");
  for (const f of features) {
    if (f.id != null) {
      map.setFeatureState({ source: "ber-land-anchors", id: f.id }, { selected: false });
    }
  }
  if (siteId) {
    map.setFeatureState({ source: "ber-land-anchors", id: siteId }, { selected: true });
  }
}

/** @deprecated Handled by bindWarRoomMapClicks */
export function bindMapInteractions(_map: MapLibreMap, _onSelectMember: (id: string | null) => void) {}
