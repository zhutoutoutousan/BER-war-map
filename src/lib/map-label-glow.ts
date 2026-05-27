import type { Map as MapLibreMap } from "maplibre-gl";

/** Boost basemap place/road label glow (vector styles only). */
export function applyBasemapLabelGlow(map: MapLibreMap) {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    const layout = layer.layout as Record<string, unknown> | undefined;
    if (!layout?.["text-field"]) continue;

    const id = layer.id;
    try {
      map.setPaintProperty(id, "text-color", [
        "interpolate",
        ["linear"],
        ["zoom"],
        8,
        "rgba(200, 220, 255, 0.75)",
        12,
        "rgba(230, 245, 255, 0.95)"
      ]);
      map.setPaintProperty(id, "text-halo-color", "rgba(56, 189, 248, 0.55)");
      map.setPaintProperty(id, "text-halo-width", 2.2);
      map.setPaintProperty(id, "text-halo-blur", 1.2);
    } catch {
      // Some layers may not support paint overrides
    }
  }
}
