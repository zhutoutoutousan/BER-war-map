import { BENCHMARKS, benchmarkOsmBbox, getBenchmarkById } from "@/data/benchmarks";
import { SCHOENEFELD_OSM_BBOX } from "@/lib/osm-schoenefeld";

export type MapRegionId = "ber-corridor" | (string & {});

export type MapRegion = {
  id: MapRegionId;
  label: string;
  shortLabel: string;
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  /** [[west, south], [east, north]] */
  maxBounds: [[number, number], [number, number]];
  /** OSM extent — camera fits this on load / teleport */
  fitBounds?: [[number, number], [number, number]];
  isBerCorridor: boolean;
};

/** Corridor polyline extent (ber-corridor.json) — west of OSM query box */
const BER_CORRIDOR_LINE_BBOX = {
  west: 13.085,
  south: 52.305,
  east: 13.62,
  north: 52.38
};

/** Camera fit: OSM + corridor line + breathing room */
const BER_VIEW_LEEWAY = { lng: 0.024, lat: 0.02 };
/** Pan limits: slightly wider than fit so user can nudge within the slice */
const BER_PAN_LEEWAY = { lng: 0.038, lat: 0.032 };

function berCorridorFitBounds(): [[number, number], [number, number]] {
  const osm = SCHOENEFELD_OSM_BBOX;
  const c = BER_CORRIDOR_LINE_BBOX;
  return [
    [
      Math.min(osm.west, c.west) - BER_VIEW_LEEWAY.lng,
      Math.min(osm.south, c.south) - BER_VIEW_LEEWAY.lat
    ],
    [
      Math.max(osm.east, c.east) + BER_VIEW_LEEWAY.lng,
      Math.max(osm.north, c.north) + BER_VIEW_LEEWAY.lat
    ]
  ];
}

function berCorridorRegion(): MapRegion {
  const fit = berCorridorFitBounds();
  const [[west, south], [east, north]] = fit;
  return {
    id: "ber-corridor",
    label: "BER+ Schönefeld corridor",
    shortLabel: "BER+",
    center: [(west + east) / 2, (south + north) / 2],
    zoom: 8.95,
    minZoom: 8.45,
    maxZoom: 15.5,
    maxBounds: [
      [west - BER_PAN_LEEWAY.lng, south - BER_PAN_LEEWAY.lat],
      [east + BER_PAN_LEEWAY.lng, north + BER_PAN_LEEWAY.lat]
    ],
    fitBounds: fit,
    isBerCorridor: true
  };
}

export function getMapRegion(id: MapRegionId): MapRegion {
  if (id === "ber-corridor" || id === "ber-osm-prototype") return berCorridorRegion();

  const benchmark = getBenchmarkById(id);
  if (!benchmark) return berCorridorRegion();

  const bbox = benchmarkOsmBbox(benchmark);
  const padLng = 0.022;
  const padLat = 0.018;
  const zoom = (benchmark.mapZoom ?? 11) - 0.75;

  return {
    id: benchmark.id,
    label: benchmark.name,
    shortLabel: benchmark.name.split(/[—·(]/)[0].trim().slice(0, 14),
    center: [(bbox.west + bbox.east) / 2, (bbox.south + bbox.north) / 2],
    zoom,
    minZoom: Math.max(7.5, zoom - 2.8),
    maxZoom: 15,
    maxBounds: [
      [bbox.west - padLng, bbox.south - padLat],
      [bbox.east + padLng, bbox.north + padLat]
    ],
    fitBounds: [
      [bbox.west, bbox.south],
      [bbox.east, bbox.north]
    ],
    isBerCorridor: false
  };
}

/** Teleport destinations — BER home + global benchmarks */
export const TELEPORT_SITES: { id: MapRegionId; shortLabel: string }[] = [
  { id: "ber-corridor", shortLabel: "BER+" },
  ...BENCHMARKS.filter((b) => b.id !== "ber-osm-prototype").map((b) => ({
    id: b.id as MapRegionId,
    shortLabel: getMapRegion(b.id).shortLabel
  }))
];

export function nextTeleportSite(current: MapRegionId, dir: 1 | -1): MapRegionId {
  const idx = TELEPORT_SITES.findIndex((s) => s.id === current || (current === "ber-osm-prototype" && s.id === "ber-corridor"));
  const i = idx >= 0 ? idx : 0;
  const next = (i + dir + TELEPORT_SITES.length) % TELEPORT_SITES.length;
  return TELEPORT_SITES[next]!.id;
}
