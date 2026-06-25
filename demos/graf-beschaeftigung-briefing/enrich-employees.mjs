#!/usr/bin/env node
/**
 * Cross-reference named OSM employers with employee counts.
 * Sources: OSM tags → brand-employees.json (registry/press/Wikidata) → micro heuristics.
 *
 * Run: node enrich-employees.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BBOX = { south: 52.32, west: 13.42, north: 52.42, east: 13.62 };

async function fetchOsmEmployeeTags() {
  const q = `[out:json][timeout:90];
(
  node["employees"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["employees"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["staff_count"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "BER+ employee enrich/1.0" },
    signal: AbortSignal.timeout(95_000)
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  const map = new Map();
  for (const el of data.elements ?? []) {
    const raw = el.tags?.employees ?? el.tags?.staff_count;
    const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n)) continue;
    map.set(`${el.type}/${el.id}`, {
      employees: n,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      source: "OpenStreetMap tag",
      confidence: "osm_tag",
      scope: "osm_site"
    });
  }
  return map;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function resolveSubBrand(hay, brand) {
  if (!brand.employeesByBrand) return null;
  const h = hay.toLowerCase();
  if (h.includes("barmenia")) return brand.employeesByBrand.barmenia;
  if (h.includes("huk")) return brand.employeesByBrand.huk;
  if (h.includes("allianz")) return brand.employeesByBrand.allianz;
  if (h.includes("netto")) return brand.employeesByBrand.netto;
  if (h.includes("penny")) return brand.employeesByBrand.penny;
  if (h.includes("fressnapf")) return brand.employeesByBrand.fressnapf;
  if (h.includes("mercedes")) return brand.employeesByBrand.mercedes;
  if (h.includes("man truck") || h.includes("man ")) return brand.employeesByBrand.man;
  return null;
}

function matchBrand(hay, brands) {
  for (const brand of brands) {
    const re = new RegExp(brand.match, "i");
    if (!re.test(hay)) continue;

    const sub = resolveSubBrand(hay, brand);
    if (sub) {
      return {
        employees: sub.employees,
        scope: brand.scope,
        source: sub.source,
        confidence: brand.confidence
      };
    }

    return {
      employees: brand.employees,
      employeesRange: brand.employeesRange ?? null,
      firms: brand.firms ?? null,
      scope: brand.scope,
      source: brand.source,
      confidence: brand.confidence
    };
  }
  return null;
}

const RETAIL_OUTLET_RE =
  /\b(netto|penny|rewe|edeka|e-center|e center|lidl|aldi|kaufland|ikea|bauhaus|mcdonald|fressnapf|hem\b|tankstelle)\b/i;
const INSURANCE_BRANCH_RE = /\b(versicherung|allianz|barmenia|huk)\b/i;

/** Never assign Konzern-HQ headcount to a single OSM Filiale / depot pin. */
function normalizeBrandForSite(site, brand) {
  if (brand.scope !== "group") return brand;

  const corporateEmployees = brand.employees ?? null;
  const corporateSource = brand.source ?? "corporate registry";
  const groupCorporate =
    corporateEmployees != null
      ? { employees: corporateEmployees, source: corporateSource }
      : undefined;

  const isRetailOutlet = site.landuse === "retail" || RETAIL_OUTLET_RE.test(site.name);
  const isInsuranceBranch = INSURANCE_BRANCH_RE.test(site.name);

  if (isRetailOutlet) {
    const range =
      site.areaHa != null && site.areaHa > 0.8 ? "12–35" : site.areaHa != null && site.areaHa > 0.4 ? "8–25" : "6–18";
    return {
      employees: null,
      employeesRange: range,
      scope: "outlet_estimate",
      source: `Einzelhandelsfiliale — Konzernzahl (${corporateEmployees?.toLocaleString("de-DE") ?? "n/a"} gesamt) nicht als Standortwert`,
      confidence: "estimate",
      groupCorporate
    };
  }

  if (isInsuranceBranch) {
    return {
      employees: null,
      employeesRange: "3–12",
      scope: "outlet_estimate",
      source: `Versicherungsagentur/Zweig — Konzernzahl nicht als Standortwert · ${corporateSource}`,
      confidence: "estimate",
      groupCorporate
    };
  }

  // Depot, Logistikzentrum, Büro — brand on map ≠ global headcount; route to prediction
  return {
    employees: null,
    employeesRange: null,
    scope: "brand_present",
    source: `Marke vor Ort — Konzernzahl nicht übernommen · ${corporateSource}`,
    confidence: "unknown",
    groupCorporate
  };
}

function inferMicroEmployer(site) {
  const lu = site.landuse ?? "";
  const micro = new Set([
    "lawyer",
    "tax_advisor",
    "estate_agent",
    "travel_agent",
    "insurance",
    "reception",
    "religion",
    "moving_company",
    "engineer",
    "design",
    "advertising_agency"
  ]);
  if (micro.has(lu)) {
    return {
      employees: null,
      employeesRange: "1–10",
      scope: "micro_site",
      source: "Heuristic: professional / agency branch — no public filing",
      confidence: "estimate"
    };
  }
  if (lu === "retail" && (site.areaHa == null || site.areaHa < 0.5)) {
    return {
      employees: null,
      employeesRange: "5–25",
      scope: "micro_site",
      source: "Heuristic: retail unit staffing band",
      confidence: "estimate"
    };
  }
  return {
    employees: null,
    employeesRange: null,
    scope: "unknown",
    source: "No public site-level Beschäftigtenzahl found",
    confidence: "unknown"
  };
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "corridor-snapshot.json"), "utf8"));
  const brandDb = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "brand-employees.json"), "utf8"));

  console.log("Fetching OSM employee tags…");
  let osmEmployees = new Map();
  try {
    osmEmployees = await fetchOsmEmployeeTags();
    console.log(`  ${osmEmployees.size} OSM elements with employees/staff_count`);
  } catch (e) {
    console.warn("  OSM employee tag fetch skipped:", e instanceof Error ? e.message : e);
  }

  const enriched = [];

  for (const site of snapshot.sites) {
    const record = {
      id: site.id,
      name: site.name,
      landuse: site.landuse,
      lat: site.lat,
      lon: site.lon,
      named: site.named,
      employees: null,
      employeesRange: null,
      firms: null,
      scope: null,
      source: null,
      confidence: "unknown"
    };

    const osmDirect = osmEmployees.get(site.id);
    if (osmDirect) {
      Object.assign(record, osmDirect);
      enriched.push(record);
      continue;
    }

    let nearestOsm = null;
    let nearestKm = Infinity;
    for (const [, o] of osmEmployees) {
      if (o.lat == null) continue;
      const km = haversineKm(site, o);
      if (km < nearestKm && km < 0.15) {
        nearestKm = km;
        nearestOsm = o;
      }
    }
    if (nearestOsm) {
      Object.assign(record, {
        employees: nearestOsm.employees,
        scope: "osm_nearby",
        source: `${nearestOsm.source} (within ${Math.round(nearestKm * 1000)} m)`,
        confidence: "osm_tag"
      });
      enriched.push(record);
      continue;
    }

    const hay = `${site.name} ${site.operator ?? ""}`;
    const brand = matchBrand(hay, brandDb.brands);
    if (brand) {
      Object.assign(record, normalizeBrandForSite(site, brand));
      enriched.push(record);
      continue;
    }

    Object.assign(record, inferMicroEmployer(site));
    enriched.push(record);
  }

  const named = enriched.filter((r) => r.named);
  const withExact = named.filter((r) => r.employees != null);
  const withRange = named.filter((r) => r.employeesRange);
  const verified = named.filter((r) => ["registry", "member_cited", "osm_tag"].includes(r.confidence));
  const groupLevel = named.filter((r) => r.groupCorporate != null);
  const siteLevel = named.filter(
    (r) =>
      ["site", "entity", "osm_site", "osm_nearby"].includes(r.scope) &&
      r.employees != null &&
      r.confidence !== "group"
  );

  const seenEntity = new Set();
  const sumSiteLevel = siteLevel.reduce((s, r) => {
    const key = `${r.scope}:${r.name.toLowerCase().replace(/\s+/g, " ").trim()}`;
    if (seenEntity.has(key)) return s;
    seenEntity.add(key);
    return s + (r.employees ?? 0);
  }, 0);

  const out = {
    generatedAt: new Date().toISOString(),
    methodology:
      "Cross-reference pipeline: (1) OSM employees/staff_count tags, (2) brand-employees.json from Geschäftsbericht / Wikidata / press, (3) SME heuristics. Group figures are corporate, not Schönefeld site headcount.",
    summary: {
      totalSites: enriched.length,
      namedSites: named.length,
      withExactCount: withExact.length,
      withRangeEstimate: withRange.length,
      verifiedSources: verified.length,
      groupLevelMatches: groupLevel.length,
      siteLevelMatches: siteLevel.length,
      outletEstimates: named.filter((r) => r.scope === "outlet_estimate").length,
      brandsPresentUnmodelled: named.filter((r) => r.scope === "brand_present").length,
      sumSiteLevelEmployees: sumSiteLevel,
      disclaimer:
        "Cannot obtain all 215 site-level counts from public data alone — BER+ member validation pass required for Graf's leasing question."
    },
    records: enriched
  };

  const outPath = path.join(__dirname, "data", "employee-crossref.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`  Named: ${named.length}`);
  console.log(`  Exact count: ${withExact.length} (${groupLevel.length} group · ${siteLevel.length} site/entity)`);
  console.log(`  Range estimate: ${withRange.length}`);
  console.log(`  Sum site/entity-level only: ${sumSiteLevel}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
