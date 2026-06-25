#!/usr/bin/env node
/**
 * Refresh corridor-snapshot.json from Overpass (Schönefeld bbox).
 * Run: node fetch-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BBOX = { south: 52.32, west: 13.42, north: 52.42, east: 13.62 };
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const QUERY = `[out:json][timeout:120];
(
  way["landuse"~"industrial|commercial|retail|logistics"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["office"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["building"~"commercial|office|industrial|retail"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out center tags;`;

function haFromWay(el) {
  if (!el.bounds) return null;
  const lat = (el.bounds.maxlat - el.bounds.minlat) * 111;
  const lon = (el.bounds.maxlon - el.bounds.minlon) * 111 * Math.cos(((el.bounds.minlat + el.bounds.maxlat) / 2) * Math.PI) / 180;
  return Math.round(lat * lon * 100) / 100;
}

function nameOf(tags) {
  return tags.name ?? tags["name:de"] ?? tags.operator ?? tags.brand ?? null;
}

async function fetchOverpass() {
  const body = "data=" + encodeURIComponent(QUERY);
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "BER+ Graf Briefing Demo/1.0"
        },
        signal: AbortSignal.timeout(130_000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.elements?.length) throw new Error("empty");
      return data.elements;
    } catch (e) {
      console.warn(`  ${url}:`, e instanceof Error ? e.message : e);
    }
  }
  throw new Error("Overpass unavailable");
}

function buildSnapshot(elements) {
  const byLanduse = {};
  const sites = [];
  let namedCount = 0;

  for (const el of elements) {
    const tags = el.tags ?? {};
    const landuse = tags.landuse ?? tags.building ?? tags.office ?? "gewerbe";
    byLanduse[landuse] = (byLanduse[landuse] ?? 0) + 1;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;

    const name = nameOf(tags);
    if (name) namedCount++;
    const areaHa = el.type === "way" ? haFromWay(el) : null;

    sites.push({
      id: `${el.type}/${el.id}`,
      name: name ?? `${landuse} · OSM ${el.id}`,
      landuse,
      lat,
      lon,
      areaHa,
      operator: tags.operator ?? null,
      named: Boolean(name)
    });
  }

  sites.sort((a, b) => (b.areaHa ?? 0) - (a.areaHa ?? 0) || Number(b.named) - Number(a.named));

  return {
    fetchedAt: new Date().toISOString(),
    bbox: BBOX,
    attribution: "© OpenStreetMap contributors · Overpass API · indicative only",
    summary: {
      totalElements: elements.length,
      mappedSites: sites.length,
      namedSites: namedCount,
      byLanduse
    },
    sites: sites.slice(0, 400)
  };
}

async function main() {
  console.log("Fetching Schönefeld gewerbe layer from Overpass…");
  const elements = await fetchOverpass();
  const snapshot = buildSnapshot(elements);
  const out = path.join(__dirname, "data", "corridor-snapshot.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${out}`);
  console.log(`  ${snapshot.summary.totalElements} elements → ${snapshot.summary.mappedSites} sites (${snapshot.summary.namedSites} named)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
