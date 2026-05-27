import { CURATED_CCTV_FEEDS, SCHOENEFELD_CENTER, type CctvFeed } from "@/data/cctv-feeds";
import { camerasToGeoJSON } from "@/lib/cctv-geojson";
import { fetchAllOpenCctvGermany, type OpenCctvCamera } from "@/lib/opencctv";

export type AutobahnWebcam = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  coordinates: [number, number];
  road: string;
  distanceKm: number;
};

type CacheEntry = {
  expiresAt: number;
  autobahn: AutobahnWebcam[];
  autobahnError?: string;
  opencctv: OpenCctvCamera[];
  opencctvError?: string;
};

const CACHE_KEY = "__ber_cctv_cache_v2__";
const TTL_MS = 30 * 60 * 1000;
const BER_ROADS = ["A10", "A113", "A13", "A100", "A115", "A117", "A12", "A9", "A2"] as const;

const globalCache = globalThis as typeof globalThis & { [CACHE_KEY]?: CacheEntry };

function haversineKm(a: [number, number], b: [number, number]) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

type RoadWebcamRef = { identifier: string; title?: string; coordinate?: { lat: string; long: string } };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "user-agent": "BER-war-map/0.1 CCTV (+https://www.ber-plus.de/)" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchAutobahnWebcamsForRoad(road: string): Promise<AutobahnWebcam[]> {
  const list = await fetchJson<{ webcam?: RoadWebcamRef[] }>(
    `https://verkehr.autobahn.de/o/autobahn/${encodeURIComponent(road)}/services/webcam`
  );
  const refs = list.webcam ?? [];
  if (!refs.length) return [];

  const details = await Promise.all(
    refs.slice(0, 20).map(async (ref) => {
      try {
        const d = await fetchJson<{
          title?: string;
          subtitle?: string;
          imageurl?: string;
          linkurl?: string;
          coordinate?: { lat: string; long: string };
        }>(`https://verkehr.autobahn.de/o/autobahn/details/webcam/${encodeURIComponent(ref.identifier)}`);

        const lat = parseFloat(d.coordinate?.lat ?? ref.coordinate?.lat ?? "");
        const lng = parseFloat(d.coordinate?.long ?? ref.coordinate?.long ?? "");
        if (!d.imageurl || Number.isNaN(lat) || Number.isNaN(lng)) return null;

        const coords: [number, number] = [lng, lat];
        const distanceKm = haversineKm(SCHOENEFELD_CENTER, coords);

        return {
          id: ref.identifier,
          title: d.title ?? ref.title ?? `${road} webcam`,
          subtitle: d.subtitle,
          imageUrl: d.imageurl,
          linkUrl: d.linkurl,
          coordinates: coords,
          road,
          distanceKm: Math.round(distanceKm * 10) / 10
        } satisfies AutobahnWebcam;
      } catch {
        return null;
      }
    })
  );

  const out: AutobahnWebcam[] = [];
  for (const d of details) {
    if (d) out.push(d);
  }
  return out;
}

async function loadCctvCache(): Promise<CacheEntry> {
  const cached = globalCache[CACHE_KEY];
  if (cached && Date.now() < cached.expiresAt) return cached;

  const [autobahnResult, opencctvResult] = await Promise.all([
    (async () => {
      try {
        const batches = await Promise.all(BER_ROADS.map((road) => fetchAutobahnWebcamsForRoad(road)));
        return { webcams: batches.flat().sort((a, b) => a.distanceKm - b.distanceKm) };
      } catch (e) {
        return {
          webcams: [] as AutobahnWebcam[],
          error: e instanceof Error ? e.message : "Autobahn API unavailable"
        };
      }
    })(),
    fetchAllOpenCctvGermany()
  ]);

  const entry: CacheEntry = {
    expiresAt: Date.now() + TTL_MS,
    autobahn: autobahnResult.webcams,
    autobahnError: autobahnResult.error,
    opencctv: opencctvResult.cameras,
    opencctvError: opencctvResult.error
  };
  globalCache[CACHE_KEY] = entry;
  return entry;
}

export async function fetchNearbyAutobahnWebcams(): Promise<{ webcams: AutobahnWebcam[]; error?: string }> {
  const entry = await loadCctvCache();
  return { webcams: entry.autobahn, error: entry.autobahnError };
}

export async function fetchNearbyOpenCctv(): Promise<{ cameras: OpenCctvCamera[]; error?: string }> {
  const entry = await loadCctvCache();
  return { cameras: entry.opencctv, error: entry.opencctvError };
}

export type CctvAggregate = {
  curated: CctvFeed[];
  autobahn: AutobahnWebcam[];
  autobahnError?: string;
  opencctv: OpenCctvCamera[];
  opencctvError?: string;
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point>;
  totalMapCameras: number;
  note: string;
};

export async function getCctvAggregate(): Promise<CctvAggregate> {
  const entry = await loadCctvCache();
  const geojson = camerasToGeoJSON(entry.opencctv, entry.autobahn);
  const totalMapCameras = geojson.features.length;
  return {
    curated: CURATED_CCTV_FEEDS,
    autobahn: entry.autobahn,
    autobahnError: entry.autobahnError,
    opencctv: entry.opencctv,
    opencctvError: entry.opencctvError,
    geojson,
    totalMapCameras,
    note:
      "Public CCTV across Germany (opencctv.org) plus Autobahn Verkehrskameras when available. Click a camera marker on the map — clusters expand when you zoom in."
  };
}

export type { OpenCctvCamera };
