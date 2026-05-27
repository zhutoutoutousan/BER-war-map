import { SCHOENEFELD_CENTER } from "@/data/cctv-feeds";

/** Public aggregator — https://opencctv.org/cameras/germany */
export const OPENCCTV_MAP_URL = "https://opencctv.org/cameras/germany";
export const OPENCCTV_API = "https://opencctv.org/api/cameras";

/** Germany bounding box for grid fetch */
export const GERMANY_BOUNDS = {
  south: 47.2,
  west: 5.8,
  north: 55.1,
  east: 15.1
};

export type OpenCctvCamera = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  category: string;
  feedType: "image" | "iframe" | "hls" | string;
  imageUrl: string;
  pageUrl: string;
  coordinates: [number, number];
  distanceKm: number;
  source: string;
  updateRateMs?: number;
};

type RawOpenCctv = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  feed_url: string;
  feed_type: string;
  category: string;
  source: string;
  update_rate?: number;
  active?: number;
  traffic_slug?: string | null;
};

const TILE_ROWS = 4;
const TILE_COLS = 4;
const TILE_LIMIT = 500;
const TILE_CONCURRENCY = 4;

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

function pageUrlFor(cam: RawOpenCctv): string {
  if (cam.traffic_slug) return `https://opencctv.org/camera/${cam.traffic_slug}`;
  return `https://opencctv.org/camera/${cam.id}`;
}

function rawToCamera(cam: RawOpenCctv): OpenCctvCamera | null {
  if (cam.active === 0) return null;
  if (!cam.feed_url || !cam.lat || !cam.lng) return null;
  const coords: [number, number] = [cam.lng, cam.lat];
  return {
    id: cam.id,
    name: cam.name,
    city: cam.city,
    state: cam.state ?? undefined,
    category: cam.category,
    feedType: cam.feed_type,
    imageUrl: cam.feed_url,
    pageUrl: pageUrlFor(cam),
    coordinates: coords,
    distanceKm: Math.round(haversineKm(SCHOENEFELD_CENTER, coords) * 10) / 10,
    source: cam.source,
    updateRateMs: cam.update_rate
  };
}

async function fetchTileBounds(south: number, west: number, north: number, east: number): Promise<RawOpenCctv[]> {
  const url = `${OPENCCTV_API}?bounds=${south},${west},${north},${east}&limit=${TILE_LIMIT}`;
  const res = await fetch(url, {
    headers: { "user-agent": "BER-war-map/0.1 CCTV (+https://www.ber-plus.de/)" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000)
  });
  if (!res.ok) throw new Error(`opencctv HTTP ${res.status}`);
  return res.json() as Promise<RawOpenCctv[]>;
}

function germanyTiles(): { south: number; west: number; north: number; east: number }[] {
  const { south, west, north, east } = GERMANY_BOUNDS;
  const tiles: { south: number; west: number; north: number; east: number }[] = [];
  for (let r = 0; r < TILE_ROWS; r++) {
    for (let c = 0; c < TILE_COLS; c++) {
      tiles.push({
        south: south + ((north - south) * r) / TILE_ROWS,
        west: west + ((east - west) * c) / TILE_COLS,
        north: south + ((north - south) * (r + 1)) / TILE_ROWS,
        east: west + ((east - west) * (c + 1)) / TILE_COLS
      });
    }
  }
  return tiles;
}

async function runPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

/** Fetch all active opencctv cameras in Germany (grid tiles, deduped). */
export async function fetchAllOpenCctvGermany(): Promise<{ cameras: OpenCctvCamera[]; error?: string }> {
  try {
    const tiles = germanyTiles();
    const batches = await runPool(tiles, TILE_CONCURRENCY, (t) =>
      fetchTileBounds(t.south, t.west, t.north, t.east)
    );

    const byId = new Map<string, OpenCctvCamera>();
    for (const batch of batches) {
      for (const raw of batch) {
        if (byId.has(raw.id)) continue;
        const cam = rawToCamera(raw);
        if (cam) byId.set(cam.id, cam);
      }
    }

    const cameras = [...byId.values()].sort((a, b) => a.distanceKm - b.distanceKm);
    return { cameras };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "opencctv.org unavailable";
    return { cameras: [], error: msg };
  }
}

/** @deprecated use fetchAllOpenCctvGermany */
export async function fetchOpenCctvNearBer() {
  return fetchAllOpenCctvGermany();
}
