import type { Map as MapLibreMap } from "maplibre-gl";
import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import { OSM_INTEL_CATEGORIES } from "@/lib/osm-intel-categories";

const PREFIX = "[ber-osm]";
const LS_KEY = "ber-osm-trace";

function tracingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const forced = window.localStorage.getItem(LS_KEY);
    if (forced === "0") return false;
    if (forced === "1") return true;
  } catch {
    /* ignore */
  }
  // Dev: on by default so freezes are visible without localStorage setup
  return process.env.NODE_ENV === "development";
}

/** Expensive — only when trace=1 and ber-osm-trace-query=1 */
function deepQueryEnabled(): boolean {
  if (!tracingEnabled()) return false;
  try {
    return window.localStorage.getItem(`${LS_KEY}-query`) === "1";
  } catch {
    return false;
  }
}

function stamp() {
  return new Date().toISOString().slice(11, 23);
}

/** Filter DevTools console with: ber-osm */
export function isOsmMapTraceEnabled(): boolean {
  return tracingEnabled();
}

export function osmTrace(scope: string, message: string, data?: Record<string, unknown>) {
  if (!tracingEnabled()) return;
  if (data) console.log(`${PREFIX} ${stamp()} [${scope}] ${message}`, data);
  else console.log(`${PREFIX} ${stamp()} [${scope}] ${message}`);
}

export function osmTraceWarn(scope: string, message: string, data?: Record<string, unknown>) {
  if (!tracingEnabled()) return;
  if (data) console.warn(`${PREFIX} ${stamp()} [${scope}] ${message}`, data);
  else console.warn(`${PREFIX} ${stamp()} [${scope}] ${message}`);
}

export function osmTraceSkip(scope: string, reason: string, data?: Record<string, unknown>) {
  osmTraceWarn(scope, `SKIP: ${reason}`, data);
}

const OSM_LAYER_PROBE = [
  "osm-intel-land-fill",
  "osm-intel-industry-fill",
  "osm-intel-power-fill",
  "osm-intel-member-super-fill",
  "osm-intel-icon-hit-industry",
  "osm-intel-icon-industry"
] as const;

export function osmTraceMapSnapshot(
  map: MapLibreMap,
  label: string,
  extra?: Record<string, unknown> & {
    /** Pass from GeoJSON to avoid querySourceFeatures (blocks UI on 10k+ features). */
    featureCount?: number;
    iconCount?: number;
  }
) {
  if (!tracingEnabled()) return;

  const { featureCount: passedFeatures, iconCount: passedIcons, ...restExtra } = extra ?? {};

  const layers: Record<string, { exists: boolean; visibility?: string; filter?: unknown }> = {};
  for (const id of OSM_LAYER_PROBE) {
    const layer = map.getLayer(id);
    if (!layer) {
      layers[id] = { exists: false };
      continue;
    }
    layers[id] = {
      exists: true,
      visibility: map.getLayoutProperty(id, "visibility") as string | undefined,
      filter: map.getFilter(id)
    };
  }

  let sourceFeatureCount: number | null = passedFeatures ?? null;
  let iconSourceCount: number | null = passedIcons ?? null;

  if (deepQueryEnabled()) {
    try {
      if (sourceFeatureCount == null && map.getSource("ber-osm-intel")) {
        sourceFeatureCount = map.querySourceFeatures("ber-osm-intel").length;
      }
      if (iconSourceCount == null && map.getSource("ber-osm-intel-icons")) {
        iconSourceCount = map.querySourceFeatures("ber-osm-intel-icons").length;
      }
    } catch (e) {
      osmTraceWarn("snapshot", "querySourceFeatures failed", {
        error: e instanceof Error ? e.message : String(e)
      });
    }
  }

  let renderedAtCenter = 0;
  const probeLayers = OSM_LAYER_PROBE.filter((id) => map.getLayer(id));
  if (probeLayers.length) {
    try {
      const center = map.getCenter();
      const pt = map.project(center);
      renderedAtCenter = map.queryRenderedFeatures(pt, { layers: [...probeLayers] }).length;
    } catch {
      /* ignore */
    }
  }

  osmTrace("snapshot", label, {
    zoom: map.getZoom(),
    center: map.getCenter().toArray(),
    styleLoaded: map.isStyleLoaded(),
    loaded: map.loaded(),
    hasCorridor: Boolean(map.getSource("ber-corridor")),
    hasOsmSource: Boolean(map.getSource("ber-osm-intel")),
    hasOsmIconsSource: Boolean(map.getSource("ber-osm-intel-icons")),
    sourceFeatureCount,
    iconSourceCount,
    renderedAtCenter,
    layers,
    ...restExtra
  });
}

export function osmTraceVisibility(
  visible: Record<OsmIntelCategory, boolean>,
  berTargetsOnly: boolean,
  focusMemberId?: string | null
) {
  if (!tracingEnabled()) return;
  osmTrace("visibility", "apply", {
    visible,
    berTargetsOnly,
    focusMemberId: focusMemberId ?? null
  });
}

export function osmTraceClick(
  point: { x: number; y: number },
  layers: string[],
  hits: { layerId: string; id?: string }[],
  picked: { featureId: string } | null
) {
  if (!tracingEnabled()) return;
  osmTrace("click", picked ? "picked OSM" : "no OSM pick", {
    point,
    layerCount: layers.length,
    hitCount: hits.length,
    hits: hits.slice(0, 8),
    picked
  });
}

/** Run in browser console: localStorage.setItem('ber-osm-trace','1') then reload */
export function enableOsmMapTrace(on = true) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, on ? "1" : "0");
  osmTrace("config", on ? "trace ON — reload page" : "trace OFF — reload page");
}

if (typeof window !== "undefined") {
  (window as Window & { enableOsmMapTrace?: typeof enableOsmMapTrace }).enableOsmMapTrace =
    enableOsmMapTrace;
}
