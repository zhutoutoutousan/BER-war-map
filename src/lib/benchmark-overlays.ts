import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { Benchmark } from "@/data/benchmarks";
import { BENCHMARKS } from "@/data/benchmarks";
import {
  benchmarkComparisonLinesGeoJSON,
  benchmarksToGeoJSON
} from "@/lib/benchmark-geo";

export function benchmarkStakeholdersToGeoJSON(benchmark: Benchmark | null): GeoJSON.FeatureCollection {
  if (!benchmark?.stakeholders?.length) {
    return { type: "FeatureCollection", features: [] };
  }
  const [lng, lat] = benchmark.coordinates;
  return {
    type: "FeatureCollection",
    features: benchmark.stakeholders.map((s, i) => {
      const angle = (i / benchmark.stakeholders!.length) * Math.PI * 2;
      const r = 0.012 + (i % 3) * 0.004;
      return {
        type: "Feature",
        id: `stakeholder-${i}`,
        properties: {
          name: s.name,
          role: s.role,
          benchmarkId: benchmark.id
        },
        geometry: {
          type: "Point",
          coordinates: [lng + Math.cos(angle) * r, lat + Math.sin(angle) * r * 0.7]
        }
      };
    })
  };
}

/** All benchmark stakeholders — always visible on map */
export function allBenchmarkStakeholdersToGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const b of BENCHMARKS) {
    features.push(...benchmarkStakeholdersToGeoJSON(b).features);
  }
  return { type: "FeatureCollection", features };
}

const BENCHMARK_LAYERS = ["benchmark-lines", "benchmark-glow", "benchmark-points", "benchmark-labels"];

export function benchmarkLayersReady(map: MapLibreMap) {
  return Boolean(map.getSource("benchmark-points") && map.getLayer("benchmark-points"));
}

export function setupBenchmarkOverlays(map: MapLibreMap) {
  const points = benchmarksToGeoJSON();
  const lines = benchmarkComparisonLinesGeoJSON();

  if (!map.getSource("benchmark-points")) {
    map.addSource("benchmark-points", { type: "geojson", data: points });
  }
  if (!map.getSource("benchmark-lines")) {
    map.addSource("benchmark-lines", { type: "geojson", data: lines });
  }

  if (!map.getLayer("benchmark-lines")) {
    map.addLayer({
      id: "benchmark-lines",
      type: "line",
      source: "benchmark-lines",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.5,
        "line-opacity": 0.35,
        "line-dasharray": [2, 3]
      }
    });
  }

  if (!map.getLayer("benchmark-glow")) {
    map.addLayer({
      id: "benchmark-glow",
      type: "circle",
      source: "benchmark-points",
      paint: {
        "circle-radius": ["case", ["get", "isPrototype"], 18, 12],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.22,
        "circle-blur": 0.6
      }
    });
  }

  if (!map.getLayer("benchmark-points")) {
    map.addLayer({
      id: "benchmark-points",
      type: "circle",
      source: "benchmark-points",
      paint: {
        "circle-radius": [
          "case",
          ["get", "isPrototype"],
          10,
          ["interpolate", ["linear"], ["zoom"], 1, 6, 4, 9, 8, 12]
        ],
        "circle-color": ["get", "color"],
        "circle-stroke-width": ["case", ["get", "isPrototype"], 2.5, 1.5],
        "circle-stroke-color": "#ffffff"
      }
    });
  }

  if (!map.getLayer("benchmark-labels")) {
    map.addLayer({
      id: "benchmark-labels",
      type: "symbol",
      source: "benchmark-points",
      minzoom: 2,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.3],
        "text-anchor": "top",
        "text-max-width": 14,
        "text-allow-overlap": false
      },
      paint: {
        "text-color": "rgba(255,255,255,0.85)",
        "text-halo-color": "rgba(0,0,0,0.75)",
        "text-halo-width": 1.2
      }
    });
  }

  raiseBenchmarkLayersToTop(map);
}

/** Keep benchmark pins above corridor / OSM stacks */
export function raiseBenchmarkLayersToTop(map: MapLibreMap) {
  for (const id of BENCHMARK_LAYERS) {
    if (map.getLayer(id)) {
      try {
        map.moveLayer(id);
      } catch {
        /* layer order best-effort */
      }
    }
  }
}

export function setBenchmarkLayersVisible(map: MapLibreMap, visible: boolean) {
  if (!benchmarkLayersReady(map)) return;
  const v = visible ? "visible" : "none";
  for (const id of BENCHMARK_LAYERS) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
  }
}

export function syncBenchmarkGeo(map: MapLibreMap) {
  const pts = map.getSource("benchmark-points") as GeoJSONSource | undefined;
  const ln = map.getSource("benchmark-lines") as GeoJSONSource | undefined;
  pts?.setData(benchmarksToGeoJSON());
  ln?.setData(benchmarkComparisonLinesGeoJSON());
}

export function bindBenchmarkMapClicks(
  map: MapLibreMap,
  onSelect: (id: string) => void
) {
  const key = "__berBenchmarkClicks";
  const m = map as MapLibreMap & { [key]?: boolean };
  if (m[key]) return;
  m[key] = true;

  map.on("click", "benchmark-points", (e) => {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    if (id) onSelect(id);
  });
  map.on("mouseenter", "benchmark-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "benchmark-points", () => {
    map.getCanvas().style.cursor = "";
  });
}

export function resetBenchmarkMapClicks(map: MapLibreMap) {
  const m = map as MapLibreMap & { __berBenchmarkClicks?: boolean };
  m.__berBenchmarkClicks = false;
}

const STAKEHOLDER_LAYERS = ["benchmark-stakeholder-glow", "benchmark-stakeholders"];

export function syncBenchmarkStakeholders(map: MapLibreMap, geo: GeoJSON.FeatureCollection) {
  if (!map.getSource("benchmark-stakeholders")) {
    map.addSource("benchmark-stakeholders", { type: "geojson", data: geo });
  } else {
    (map.getSource("benchmark-stakeholders") as GeoJSONSource).setData(geo);
  }

  if (!map.getLayer("benchmark-stakeholder-glow")) {
    map.addLayer({
      id: "benchmark-stakeholder-glow",
      type: "circle",
      source: "benchmark-stakeholders",
      paint: {
        "circle-radius": 14,
        "circle-color": "#f472b6",
        "circle-opacity": 0.15,
        "circle-blur": 0.5
      }
    });
  }

  if (!map.getLayer("benchmark-stakeholders")) {
    map.addLayer({
      id: "benchmark-stakeholders",
      type: "circle",
      source: "benchmark-stakeholders",
      paint: {
        "circle-radius": 7,
        "circle-color": "#f472b6",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff"
      }
    });
  }

  for (const id of STAKEHOLDER_LAYERS) {
    if (map.getLayer(id)) map.moveLayer(id);
  }
}

export function setBenchmarkStakeholdersVisible(map: MapLibreMap, visible: boolean) {
  const v = visible ? "visible" : "none";
  for (const id of STAKEHOLDER_LAYERS) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
  }
}
