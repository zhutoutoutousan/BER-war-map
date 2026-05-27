/** Shared geodesy helpers */

/** Circular ring [lng,lat][] closed for GeoJSON polygon */
export function ringFromRadiusKm(
  center: [number, number],
  radiusKm: number,
  steps = 48
): [number, number][] {
  const radiusM = radiusKm * 1000;
  const lat = center[1];
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([
      center[0] + (radiusM * Math.cos(a)) / mPerDegLng,
      center[1] + (radiusM * Math.sin(a)) / mPerDegLat
    ]);
  }
  return ring;
}

function bearingDeg(a: [number, number], b: [number, number]) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function offsetPoint(
  [lng, lat]: [number, number],
  bearing: number,
  distM: number
): [number, number] {
  const R = 6371000;
  const br = (bearing * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(distM / R) + Math.cos(φ1) * Math.sin(distM / R) * Math.cos(br));
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(br) * Math.sin(distM / R) * Math.cos(φ1),
      Math.cos(distM / R) - Math.sin(φ1) * Math.sin(φ2)
    );
  return [(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI];
}

/** Rough buffer polygon around a LineString (indicative corridor ribbon). */
export function bufferLineToPolygon(
  coords: [number, number][],
  radiusKm: number
): [number, number][] {
  if (coords.length < 2) return [];
  const radiusM = radiusKm * 1000;
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i < coords.length; i++) {
    const bearing =
      i < coords.length - 1 ? bearingDeg(coords[i], coords[i + 1]) : bearingDeg(coords[i - 1], coords[i]);
    left.push(offsetPoint(coords[i], bearing - 90, radiusM));
    right.push(offsetPoint(coords[i], bearing + 90, radiusM));
  }

  return [...left, ...right.reverse(), left[0]];
}

export function haversineKm(a: [number, number], b: [number, number]) {  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
