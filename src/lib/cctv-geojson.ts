import type { AutobahnWebcam } from "@/lib/cctv";
import type { OpenCctvCamera } from "@/lib/opencctv";

export const CCTV_CATEGORY_COLORS: Record<string, string> = {
  traffic: "#f59e0b",
  airport: "#38bdf8",
  weather: "#a78bfa",
  water: "#22d3ee",
  nature: "#10b981",
  ski: "#e2e8f0",
  satellite: "#94a3b8"
};

export function cctvCategoryColor(category: string) {
  return CCTV_CATEGORY_COLORS[category] ?? "#f472b6";
}

export type CctvMapProperties = {
  id: string;
  source: "opencctv" | "autobahn";
  name: string;
  category: string;
  feedType: string;
  color: string;
  city?: string;
  road?: string;
  distanceKm: number;
  pageUrl: string;
  imageUrl: string;
};

export function camerasToGeoJSON(
  opencctv: OpenCctvCamera[],
  autobahn: AutobahnWebcam[]
): GeoJSON.FeatureCollection<GeoJSON.Point, CctvMapProperties> {
  const features: GeoJSON.Feature<GeoJSON.Point, CctvMapProperties>[] = [];

  for (const cam of opencctv) {
    features.push({
      type: "Feature",
      id: `opencctv-${cam.id}`,
      geometry: { type: "Point", coordinates: cam.coordinates },
      properties: {
        id: `opencctv-${cam.id}`,
        source: "opencctv",
        name: cam.name,
        category: cam.category,
        feedType: cam.feedType,
        color: cctvCategoryColor(cam.category),
        city: cam.city,
        distanceKm: cam.distanceKm,
        pageUrl: cam.pageUrl,
        imageUrl: cam.imageUrl
      }
    });
  }

  for (const cam of autobahn) {
    features.push({
      type: "Feature",
      id: `autobahn-${cam.id}`,
      geometry: { type: "Point", coordinates: cam.coordinates },
      properties: {
        id: `autobahn-${cam.id}`,
        source: "autobahn",
        name: cam.title,
        category: "traffic",
        feedType: "image",
        color: "#22d3ee",
        road: cam.road,
        distanceKm: cam.distanceKm,
        pageUrl: cam.linkUrl ?? "https://verkehr.autobahn.de/",
        imageUrl: cam.imageUrl
      }
    });
  }

  return { type: "FeatureCollection", features };
}
