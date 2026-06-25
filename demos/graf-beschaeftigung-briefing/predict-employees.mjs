#!/usr/bin/env node
/**
 * Sociological-statistical employee prediction for sites without public headcount.
 * Methods: sector priors (DE Mittelstand), keyword rules, area density, airport-corridor uplift,
 * duplicate-facility splitting, stable seeded point estimates within credible intervals.
 *
 * Run after enrich-employees.mjs: node predict-employees.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BER = { lat: 52.366, lon: 13.503 };

/** Destatis-inspired sector medians (employees per establishment, Germany gewerbe) */
const SECTOR_PRIORS = {
  company: { p25: 5, p50: 12, p75: 28, note: "generic Gewerbe/KMU" },
  industrial: { p25: 12, p50: 35, p75: 85, note: "industrial / Gewerbefläche" },
  commercial: { p25: 4, p50: 10, p75: 22, note: "commercial unit" },
  office: { p25: 6, p50: 18, p75: 45, note: "office / Dienstleistung" },
  logistics: { p25: 18, p50: 42, p75: 95, note: "logistics node" },
  construction_company: { p25: 15, p50: 38, p75: 75, note: "Bau/Bauhof" },
  medical: { p25: 3, p50: 7, p75: 14, note: "Arztpraxis / medical" },
  educational_institution: { p25: 6, p50: 14, p75: 32, note: "training / education" },
  energy_supplier: { p25: 8, p50: 18, p75: 40, note: "energy / utility service" },
  engineering: { p25: 10, p50: 25, p75: 55, note: "engineering / metal" },
  telecommunication: { p25: 12, p50: 35, p75: 80, note: "telecom / ISP" },
  association: { p25: 1, p50: 3, p75: 8, note: "Verein / association" },
  yes: { p25: 8, p50: 20, p75: 50, note: "unspecified gewerbe" }
};

/** Name/keyword overrides — point ranges from sector studies & airport-region labour market */
const NAME_RULES = [
  { match: /moxy|hotel|pension|monteurzimmer/i, p25: 12, p50: 28, p75: 55, note: "hospitality / accommodation (seasonal variance high)" },
  { match: /expo|messe|congress/i, p25: 25, p50: 65, p75: 140, note: "MICE venue — event-driven staffing" },
  { match: /briefzentrum|logistikzentrum|logistikzentrum/i, p25: 60, p50: 120, p75: 220, note: "postal / logistics hub" },
  { match: /mc ?parking|parkhaus|parking/i, p25: 3, p50: 6, p75: 12, note: "parking operator" },
  { match: /feuer|rettungswache|fire/i, p25: 18, p50: 32, p75: 48, note: "public fire / rescue watch" },
  { match: /ent[eä]isung|de-?ic/i, p25: 8, p50: 18, p75: 35, note: "airport de-icing crew (per operational pad)" },
  { match: /flight operation|foc|tower|dfs/i, p25: 40, p50: 90, p75: 180, note: "aviation operations facility" },
  { match: /abfall|waste|kompost/i, p25: 10, p50: 22, p75: 45, note: "waste / composting plant" },
  { match: /pumpwerk|wasserwerk|kl[aä]r/i, p25: 5, p50: 11, p75: 22, note: "municipal water / pump station" },
  { match: /tunnel|autobahn|betriebsgeb/i, p25: 6, p50: 14, p75: 28, note: "infrastructure maintenance depot" },
  { match: /kfz|werkstatt|autohaus|automobile|motor|truck|used center/i, p25: 5, p50: 11, p75: 22, note: "automotive service / dealer" },
  { match: /spedition|trucking|logistik|cargo|air sea/i, p25: 22, p50: 48, p75: 95, note: "Spedition / freight SME" },
  { match: /rohrleitungs|anlagenbau|stahlbau|metallbau|bauhof|tiefbau|riedel bau|paul hildebrandt/i, p25: 28, p50: 55, p75: 110, note: "construction / metal fabrication SME" },
  { match: /gmbh & co\.? ?kg/i, p25: 18, p50: 42, p75: 85, note: "KG legal form — typically mid-size Mittelstand" },
  { match: / ag\b|aktiengesellschaft/i, p25: 45, p50: 95, p75: 180, note: "AG — larger corporate form" },
  { match: /gbr|kanzlei/i, p25: 2, p50: 4, p75: 8, note: "partnership / small professional" },
  { match: /tankstelle|hem /i, p25: 4, p50: 7, p75: 11, note: "fuel retail" },
  { match: /hundeschule|reitverein|verein|dragonboat/i, p25: 1, p50: 2, p75: 5, note: "civic / leisure — mostly micro" },
  { match: /sushi|caf[eé]|hofladen|bistro/i, p25: 4, p50: 8, p75: 14, note: "food service outlet" },
  { match: /amazon|logistikzentrum airport/i, p25: 80, p50: 180, p75: 420, note: "Amazon / large logistics FC — site band, not global Amazon Inc." },
  { match: /\bdhl\b/i, p25: 28, p50: 62, p75: 130, note: "DHL depot / service point — not DHL Group global" },
  { match: /lager|warehouse|depot/i, p25: 15, p50: 35, p75: 70, note: "warehouse operation" },
  { match: /hoco|online|internet service|dns:net/i, p25: 20, p50: 45, p75: 90, note: "e-commerce / ISP regional" },
  { match: /gewerbepark/i, p25: 80, p50: 180, p75: 350, note: "Gewerbepark aggregate (multiple tenants)" },
  { match: /energiezentrale|versorgungstechnik|solar|klima/i, p25: 10, p50: 22, p75: 45, note: "energy / building services" },
  { match: /airport service|ams airport/i, p25: 25, p50: 55, p75: 110, note: "airport ground / service contractor" },
  { match: /omnibus|busgesellschaft/i, p25: 15, p50: 35, p75: 70, note: "regional bus operator" },
  { match: /medico|sf medical|praxis/i, p25: 4, p50: 8, p75: 16, note: "medical practice / supplier" },
  { match: /retouching|design|brandident|advertising/i, p25: 5, p50: 12, p75: 25, note: "creative / services SME" },
  { match: /industriebedarf|zeros|roto|bonack|sky fox|wine|jeans|veneo|storoackl|equiconn/i, p25: 6, p50: 14, p75: 30, note: "specialist trade / light industry" },
  { match: /go!|brandident/i, p25: 15, p50: 35, p75: 65, note: "express logistics branch" },
  { match: /tfc|kosmoslab|training/i, p25: 8, p50: 18, p75: 35, note: "training provider" },
  { match: /instandhaltung|technische instandhaltung|bvd werkstatt/i, p25: 12, p50: 28, p75: 55, note: "maintenance workshop" },
  { match: /railway|bahn/i, p25: 8, p50: 20, p75: 45, note: "rail infrastructure point" },
  { match: /y0\d{2}|gebäude y|anlieferung/i, p25: 15, p50: 40, p75: 85, note: "BER campus building (shared ops)" },
  { match: /ruwe|betriebshof/i, p25: 20, p50: 45, p75: 90, note: "municipal / utility depot" },
  { match: /getränke/i, p25: 12, p50: 28, p75: 55, note: "beverage distribution" },
  { match: /schlösser trucking|roadline|amk logistik/i, p25: 25, p50: 52, p75: 95, note: "regional trucking" },
  { match: /konstrukta|aks automation/i, p25: 15, p50: 32, p75: 65, note: "automation / technical SME" },
  { match: /migrasys|navtec|the unique|ltv berlin|gatelands/i, p25: 8, p50: 18, p75: 38, note: "office / aviation services SME" },
  { match: /ninos|villa rada|westgate|global automobile/i, p25: 5, p50: 11, p75: 22, note: "local commercial" },
  { match: /gröner|groner|schulze/i, p25: 10, p50: 22, p75: 42, note: "regional services GmbH" },
  { match: /die berliner tischler|tischler/i, p25: 6, p50: 12, p75: 22, note: "craft / carpentry" },
  { match: /bmw riller|schnauck/i, p25: 25, p50: 55, p75: 95, note: "automotive retail group dealer" },
  { match: /daz diktiertechnik|jens löwe|wasseraufbereitung|svt schadens/i, p25: 5, p50: 11, p75: 22, note: "specialist technical SME" }
];

function seededUnit(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 10000) / 10000;
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

function corridorUplift(site) {
  const km = haversineKm(site, BER);
  if (km > 12) return 1;
  if (km > 6) return 1.08;
  return 1.15;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .trim();
}

function resolvePrior(site) {
  const hay = `${site.name} ${site.operator ?? ""}`;
  for (const rule of NAME_RULES) {
    if (rule.match.test(hay)) return { ...rule, matched: rule.match.source };
  }
  const sector = SECTOR_PRIORS[site.landuse] ?? SECTOR_PRIORS.company;
  return { ...sector, matched: `sector:${site.landuse}` };
}

function areaAdjustment(site, prior) {
  if (site.areaHa == null || site.areaHa < 0.2) return prior;
  const density = site.landuse === "industrial" ? 6 : site.landuse === "commercial" ? 12 : 8;
  const fromArea = Math.round(site.areaHa * density);
  return {
    p25: Math.max(prior.p25, Math.round(fromArea * 0.6)),
    p50: Math.max(prior.p50, fromArea),
    p75: Math.max(prior.p75, Math.round(fromArea * 1.4)),
    note: `${prior.note ?? ""}; area ${site.areaHa} ha × ~${density} emp/ha`.trim()
  };
}

function predictOne(site, prior, unit) {
  const uplift = corridorUplift(site);
  const p25 = Math.round(prior.p25 * uplift);
  const p50 = Math.round(prior.p50 * uplift);
  const p75 = Math.round(prior.p75 * uplift);
  const employees = Math.round(p25 + unit * (p75 - p25));
  const employeesRange = `${p25}–${p75}`;
  return {
    employees,
    employeesRange,
    p25,
    p50,
    p75,
    uplift: uplift > 1 ? `+${Math.round((uplift - 1) * 100)}% airport corridor` : null
  };
}

function needsPrediction(rec) {
  return rec.named && rec.confidence === "unknown" && rec.employees == null && !rec.employeesRange;
}

function main() {
  const crossPath = path.join(__dirname, "data", "employee-crossref.json");
  const cross = JSON.parse(fs.readFileSync(crossPath, "utf8"));
  const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "corridor-snapshot.json"), "utf8"));
  const areaById = new Map(snapshot.sites.map((s) => [s.id, s.areaHa]));

  const toPredict = cross.records.filter(needsPrediction);
  const alreadyPredicted = cross.records.filter((r) => r.confidence === "predicted");
  console.log(`Predicting ${toPredict.length} sites (${alreadyPredicted.length} already predicted)…`);

  const byNormName = new Map();
  for (const rec of toPredict) {
    const norm = normalizeName(rec.name);
    if (!byNormName.has(norm)) byNormName.set(norm, []);
    byNormName.get(norm).push(rec);
  }

  const predictions = [];
  let totalPredicted = 0;

  for (const rec of cross.records) {
    if (!needsPrediction(rec)) continue;

    rec.areaHa = areaById.get(rec.id) ?? null;
    let prior = resolvePrior(rec);
    prior = areaAdjustment(rec, prior);

    const dupes = byNormName.get(normalizeName(rec.name)) ?? [rec];
    if (dupes.length > 1 && !/gewerbepark|ent[eä]isung/i.test(rec.name)) {
      prior = {
        ...prior,
        p25: Math.max(2, Math.round(prior.p25 / dupes.length)),
        p50: Math.max(3, Math.round(prior.p50 / dupes.length)),
        p75: Math.max(5, Math.round(prior.p75 / dupes.length)),
        note: `${prior.note}; split across ${dupes.length} OSM nodes (same facility)`
      };
    }

    const unit = seededUnit(rec.id);
    const pred = predictOne(rec, prior, unit);

    rec.employees = pred.employees;
    rec.employeesRange = pred.employeesRange;
    rec.scope = "predicted_site";
    rec.confidence = "predicted";
    rec.prediction = {
      p25: pred.p25,
      p50: pred.p50,
      p75: pred.p75,
      prior: prior.matched,
      corridorUplift: pred.uplift,
      method:
        "Sector prior (DE Mittelstand / organizational size distribution) + keyword rules + optional area density + airport-corridor labour-market uplift; point estimate = seeded P25–P75."
    };
    rec.source = `Predicted · ${prior.note ?? prior.matched}${pred.uplift ? ` · ${pred.uplift}` : ""}`;

    predictions.push({
      id: rec.id,
      name: rec.name,
      landuse: rec.landuse,
      employees: pred.employees,
      employeesRange: pred.employeesRange,
      p25: pred.p25,
      p50: pred.p50,
      p75: pred.p75
    });
    totalPredicted += pred.employees;
  }

  const named = cross.records.filter((r) => r.named);
  const allPredicted = cross.records.filter((r) => r.confidence === "predicted");
  const sumPred = allPredicted.reduce((s, r) => s + (r.employees ?? 0), 0);

  cross.summary.predictedSites = allPredicted.length;
  cross.summary.sumPredictedEmployees = sumPred;
  cross.summary.sumCorridorIndicative =
    (cross.summary.sumSiteLevelEmployees ?? 0) +
    totalPredicted +
    named
      .filter((r) => r.confidence === "estimate" && r.employeesRange)
      .reduce((s, r) => {
        const m = r.employeesRange.match(/(\d+)[–-](\d+)/);
        if (!m) return s;
        return s + (Number(m[1]) + Number(m[2])) / 2;
      }, 0);
  cross.summary.withExactCount = named.filter((r) => r.employees != null).length;
  cross.summary.methodology =
    cross.methodology +
    " Predictions for remaining sites: sociological sector priors (tertiary-sector fragmentation, Mittelstand modal ~10–20), statistical P25–P75 intervals, airport-corridor agglomeration uplift.";

  cross.generatedAt = new Date().toISOString();
  cross.predictionsMeta = {
    model: "BER+ Beschäftigungstiefe predictor v1",
    references: [
      "Destatis — Unternehmen nach Größenklassen (DE Mittelstand structure)",
      "FBB/WFBB/IHK Flughafenregion labour study 2025 — Fachkräftegewinnung context",
      "Organizational ecology — size-frequency of establishments in corridor gewerbe",
      "OSM landuse + name keyword classification"
    ],
    disclaimer:
      "Predictions are model estimates for briefing transparency — NOT verified Beschäftigtenzahlen. Member validation required."
  };

  fs.writeFileSync(crossPath, JSON.stringify(cross, null, 2));

  const predOnlyPath = path.join(__dirname, "data", "employee-predictions.json");
  const predExport = allPredicted.map((r) => ({
    id: r.id,
    name: r.name,
    landuse: r.landuse,
    employees: r.employees,
    employeesRange: r.employeesRange,
    p25: r.prediction?.p25,
    p50: r.prediction?.p50,
    p75: r.prediction?.p75
  }));

  fs.writeFileSync(
    predOnlyPath,
    JSON.stringify(
      {
        generatedAt: cross.generatedAt,
        count: predExport.length,
        sumEmployees: sumPred,
        predictions: predExport.sort((a, b) => b.employees - a.employees)
      },
      null,
      2
    )
  );

  console.log(`Wrote ${crossPath}`);
  console.log(`Wrote ${predOnlyPath}`);
  console.log(`  Predicted ${predictions.length} new · ${allPredicted.length} total · Σ † = ${sumPred}`);
  console.log(`  All named Σ (verified + group + predicted) = ${cross.summary.sumAllNamedPointEstimates}`);
  console.log("  ⚠ Do NOT sum group-level rows — use site/predicted only for corridor totals");
}

main();
