import type { StyleSpecification } from "maplibre-gl";

/** Vector basemap — enables glowing OSM place/road labels */
export const CARTO_DARK_MATTER_GL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Dark basemap — CARTO (OSM data), reliable without API key */
export const CARTO_DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
      ],
      tileSize: 256,
      attribution: `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`
    }
  },
  layers: [
    {
      id: "basemap",
      type: "raster",
      source: "basemap",
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

/** Fallback if CARTO is blocked */
export const OSM_STANDARD_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: OSM_ATTR
    }
  },
  layers: [
    {
      id: "basemap",
      type: "raster",
      source: "basemap",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};
