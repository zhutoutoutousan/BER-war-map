/**
 * Thomas Graf / Beschäftigungstiefe briefing — loads real OSM snapshot + cited sources.
 */
const API_FALLBACK = [
  "data/corridor-snapshot.json",
  "https://ber-board-room.vercel.app/api/osm/schoenefeld"
];

const BB_HUB = { name: "BB Business Hub", lat: 52.388, lon: 13.512, firms: 50, employees: 800 };
const SEGRO = { name: "SEGRO Park Berlin Airport", lat: 52.372, lon: 13.518 };

const I18N = {
  en: {
    signal: "Stakeholder signal · June 2026",
    title: "Is there enough manpower near Schönefeld?",
    lead: "A dedicated briefing for Thomas Graf's question — reframed as Beschäftigungstiefe, backed by live OpenStreetMap gewerbe data and member-cited campus proof.",
    quote:
      "Do firms near Schönefeld employ enough people — will a new Büro/Gewerbe project find tenants and Fachkräfte?",
    cite: "Thomas Graf · Geschäftsführer, Alpine Immobilien GmbH · BER+ 2. Vorsitzender · BB Business Hub",
    reframe: "Reframe the question",
    notThis: "Not primarily",
    notBody: "Construction or factory labour on site — headcount of builders during shell & core.",
    rather: "Rather — Beschäftigungstiefe",
    ratherBody:
      "How many firms and jobs already exist in the corridor; can new office & gewerbe attract tenants; can those tenants recruit skilled staff (Fachkräfte) from the wider catchment.",
    evidence: "Evidence dashboard",
    evidenceSub: "Live OSM gewerbe layer · member-validated anchor · labour-market context",
    mapTitle: "Corridor gewerbe density (live OSM)",
    mapMeta: "Fetched",
    sites: "mapped sites",
    named: "named in OSM",
    tableTitle: "Named employers & gewerbe (OSM)",
    search: "Filter by name or landuse…",
    colName: "Name",
    colType: "Type",
    colEmployees: "Employees",
    colScope: "Scope",
    colSource: "Source",
    colArea: "Area",
    crossrefTitle: "Employee cross-reference",
    crossrefSub: "Named sites matched to public sources via cross-reference. Group figures are corporate, not Schönefeld site headcount.",
    filterHasData: "Only with employee data",
    filterPredicted: "Show predictions",
    predictedNote: "Predicted rows use sector priors + sociology of firm size — validate with members",
    scopeSite: "site",
    scopeGroup: "group",
    scopeEntity: "entity",
    scopeEstimate: "estimate",
    answer: "Board Room answer",
    answerBody:
      "Show Mitglieder, gewerbe layers, and corridor links on one neutral map — label everything indicative. Verified firm-level Beschäftigtenzahlen need a BER+ member validation pass, not a guess from OSM alone.",
    pilot: "90-day pilot proposal",
    step1t: "Map the question",
    step1d: "Publish this briefing + OSM gewerbe layer on the Board Room.",
    step2t: "Validate with members",
    step2d: "Alpine + 3–5 anchor Mitglieder confirm headcount ranges per site.",
    step3t: "Brief the board",
    step3d: "One recorded corridor session with Pilot-1 decision context.",
    anchors: "Pilot anchor Mitglieder",
    disclaimer:
      "Indicative probe only — not cadastral GIS, not official labour-market statistics. OSM tags do not equal employee counts.",
    sources: "Sources"
  },
  de: {
    signal: "Stakeholder-Signal · Juni 2026",
    title: "Gibt es genug „Manpower“ bei Schönefeld?",
    lead: "Ein Briefing zu Thomas Grafs Frage — umgerahmt als Beschäftigungstiefe, mit live OpenStreetMap-Gewerbedaten und mitgliederbestätigtem Campus-Beleg.",
    quote:
      "Beschäftigen die Firmen bei Schönefeld genug Menschen — findet ein neues Büro/Gewerbe-Projekt Mieter und Fachkräfte?",
    cite: "Thomas Graf · Geschäftsführer, Alpine Immobilien GmbH · BER+ 2. Vorsitzender · BB Business Hub",
    reframe: "Frage neu rahmen",
    notThis: "Nicht primär",
    notBody: "Bau- oder Fabrikarbeitskräfte auf der Baustelle — Kopfzahlen während Rohbau.",
    rather: "Sondern — Beschäftigungstiefe",
    ratherBody:
      "Wie viele Betriebe und Arbeitsplätze existieren bereits im Korridor; können neue Büro- und Gewerbeflächen Mieter gewinnen; können diese Fachkräfte aus dem erweiterten Einzugsgebiet rekrutieren.",
    evidence: "Evidenz-Dashboard",
    evidenceSub: "Live OSM-Gewerbeschicht · mitgliederbestätigter Anker · Arbeitsmarktkontext",
    mapTitle: "Gewerbedichte im Korridor (live OSM)",
    mapMeta: "Abgerufen",
    sites: "kartierte Standorte",
    named: "benannt in OSM",
    tableTitle: "Benannte Arbeitgeber & Gewerbe (OSM)",
    search: "Nach Name oder Nutzung filtern…",
    colName: "Name",
    colType: "Typ",
    colEmployees: "Beschäftigte",
    colScope: "Ebene",
    colSource: "Quelle",
    colArea: "Fläche",
    crossrefTitle: "Beschäftigten-Cross-Reference",
    crossrefSub: "Benannte Standorte per Cross-Reference mit öffentlichen Quellen verknüpft. Konzernzahlen sind nicht die Standort-Kopfzahl in Schönefeld.",
    filterHasData: "Nur mit Beschäftigtenzahl",
    filterPredicted: "Prognosen anzeigen",
    predictedNote: "Prognosezeilen nutzen Branchen-Priors + Betriebsgrößen-Verteilung — Mitglieder-Validierung nötig",
    scopeSite: "Standort",
    scopeGroup: "Konzern",
    scopeEntity: "Gesellschaft",
    scopeEstimate: "Schätzung",
    answer: "Board-Room-Antwort",
    answerBody:
      "Mitglieder, Gewerbeschichten und Korridor-Verknüpfungen auf einer neutralen Karte zeigen — alles als indikativ kennzeichnen. Verifizierte Beschäftigtenzahlen brauchen einen BER+-Mitglieder-Validierungslauf, nicht OSM-Schätzungen allein.",
    pilot: "90-Tage-Pilotvorschlag",
    step1t: "Frage kartieren",
    step1d: "Dieses Briefing + OSM-Gewerbeschicht im Board Room veröffentlichen.",
    step2t: "Mit Mitgliedern validieren",
    step2d: "Alpine + 3–5 Anker-Mitglieder bestätigen Beschäftigungs-Spannen je Standort.",
    step3t: "Vorstand briefen",
    step3d: "Eine aufgezeichnete Korridor-Session mit Pilot-1-Entscheidungskontext.",
    anchors: "Pilot-Anker Mitglieder",
    disclaimer:
      "Nur indikativer Probe-Stand — kein Kataster-GIS, keine offiziellen Arbeitsmarktstatistiken. OSM-Tags sind keine Beschäftigtenzahlen.",
    sources: "Quellen"
  }
};

let lang = "en";
let map;
let snapshot;
let sources;
let employeeById = new Map();
let crossrefSummary = null;
let showOnlyWithEmployees = false;

function t(key) {
  return I18N[lang][key] ?? key;
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    if (I18N[lang][k]) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll(".lang-toggle button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  const search = document.getElementById("site-search");
  if (search) search.placeholder = t("search");
}

async function loadData() {
  sources = await fetch("data/sources.json").then((r) => r.json());

  try {
    const crossref = await fetch("data/employee-crossref.json").then((r) => r.json());
    crossrefSummary = crossref.summary;
    employeeById = new Map(crossref.records.map((r) => [r.id, r]));
  } catch (e) {
    console.warn("employee crossref missing — run node enrich-employees.mjs", e);
  }

  for (const url of API_FALLBACK) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const raw = await res.json();
      snapshot = normalizeSnapshot(raw, url);
      if (snapshot) return;
    } catch (e) {
      console.warn("load failed:", url, e);
    }
  }
  throw new Error("No data");
}

function normalizeSnapshot(raw, url) {
  if (raw.summary?.mappedSites) return raw;
  if (raw.summary?.total && raw.geojson) {
    const sites = raw.geojson.features
      .filter((f) => f.properties?.category === "industry" || f.properties?.subcategory?.includes("commercial"))
      .map((f) => {
        const c = f.geometry.type === "Point" ? f.geometry.coordinates : centroid(f.geometry);
        return {
          id: f.properties.id,
          name: f.properties.name,
          landuse: f.properties.subcategory ?? f.properties.category,
          lat: c[1],
          lon: c[0],
          areaHa: f.properties.areaHa ?? null,
          named: Boolean(f.properties.name && !f.properties.name.includes("/"))
        };
      });
    return {
      fetchedAt: raw.fetchedAt,
      bbox: raw.bbox,
      attribution: raw.attribution,
      summary: {
        totalElements: raw.summary.total,
        mappedSites: sites.length,
        namedSites: sites.filter((s) => s.named).length,
        byLanduse: raw.summary.byCategory ?? {}
      },
      sites
    };
  }
  return null;
}

function centroid(geom) {
  if (geom.type === "Point") return geom.coordinates;
  const ring = geom.type === "Polygon" ? geom.coordinates[0] : geom.coordinates;
  let x = 0;
  let y = 0;
  for (const c of ring) {
    x += c[0];
    y += c[1];
  }
  return [x / ring.length, y / ring.length];
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return iso;
  }
}

function landuseClass(lu) {
  if (!lu) return "";
  if (lu.includes("industrial") || lu === "industrial") return "industrial";
  if (lu.includes("office") || lu === "office" || lu === "company") return "office";
  return "";
}

function fmtEmployees(rec) {
  if (!rec) return "—";
  if (rec.employees != null) {
    const n = rec.employees.toLocaleString(lang === "de" ? "de-DE" : "en-GB");
    const mark = rec.confidence === "predicted" ? "†" : rec.scope === "group" ? "*" : "";
    return `~${n}${mark}`;
  }
  if (rec.employeesRange) return rec.employeesRange;
  return "—";
}

function confClass(c) {
  return `conf-${c ?? "unknown"}`;
}

function scopeLabel(scope) {
  if (!scope) return "—";
  if (scope === "group") return t("scopeGroup");
  if (scope === "predicted_site") return lang === "de" ? "Prognose" : "predicted";
  if (scope === "site" || scope === "osm_site") return t("scopeSite");
  if (scope === "entity" || scope === "osm_nearby") return t("scopeEntity");
  if (scope === "estimate" || scope === "micro_site" || scope === "sme_logistics") return t("scopeEstimate");
  return scope;
}

function renderCrossrefBanner() {
  const el = document.getElementById("crossref-banner");
  if (!el || !crossrefSummary) return;
  el.innerHTML = `
    <strong>${t("crossrefTitle")}</strong>
    <p>${t("crossrefSub")}</p>
    <p style="margin:0.5rem 0 0;font-size:0.82rem;color:var(--muted)">
      ${crossrefSummary.withExactCount} with point estimate ·
      ${crossrefSummary.predictedSites ?? 0} predicted † ·
      ${crossrefSummary.groupLevelMatches} corporate group * ·
      ${crossrefSummary.siteLevelMatches} verified site/entity
    </p>
    <p style="margin:0.35rem 0 0;font-size:0.78rem;color:#fbbf24">${t("predictedNote")}</p>`;
}

function renderKpis() {
  const s = snapshot.summary;
  const by = s.byLanduse ?? {};
  const industrial = (by.industrial ?? 0) + (by.logistics ?? 0);
  const commercial = (by.commercial ?? 0) + (by.retail ?? 0) + (by.office ?? 0);
  const cr = crossrefSummary;

  const items = [
    {
      value: sources.bbBusinessHub.employees,
      suffix: "",
      label: lang === "de" ? "Mitarbeitende (BB Business Hub)" : "employees (BB Business Hub)",
      cls: "amber",
      source: `${sources.bbBusinessHub.source} · ~${sources.bbBusinessHub.firms} firms`
    },
    {
      value: cr?.withExactCount ?? "—",
      suffix: cr ? ` / ${cr.namedSites}` : "",
      label: lang === "de" ? "Mit Beschäftigtenzahl" : "with employee match",
      cls: "emerald",
      source: lang === "de" ? "Cross-Reference aus öffentlichen Quellen" : "cross-ref from public sources"
    },
    {
      value: cr?.sumCorridorIndicative ? Math.round(cr.sumCorridorIndicative).toLocaleString() : "—",
      suffix: "",
      label: lang === "de" ? "Korridor Σ (ohne Konzern)" : "corridor Σ (excl. group)",
      cls: "sky",
      source: lang === "de" ? "Standort + Prognose + Mikro-Schätzung" : "site + predicted + micro estimate"
    },
    {
      value: industrial,
      suffix: "",
      label: lang === "de" ? "Industrie / Logistik" : "industrial / logistics",
      cls: "",
      source: "OSM landuse tags"
    },
    {
      value: commercial,
      suffix: "",
      label: lang === "de" ? "Gewerbe / Büro / Handel" : "commercial / office / retail",
      cls: "",
      source: "OSM landuse tags"
    },
    {
      value: `~${sources.catchment.populationM}M`,
      suffix: "",
      label: lang === "de" ? "Einzugsgebiet B-BB" : "B-BB catchment",
      cls: "emerald",
      source: sources.labourStudy.topChallenge + " · FBB/WFBB/IHK 2025"
    }
  ];

  const grid = document.getElementById("kpi-grid");
  grid.innerHTML = items
    .map(
      (k) => `
    <div class="kpi">
      <div class="value ${k.cls}">${k.value}${k.suffix}</div>
      <div class="label">${k.label}</div>
      <span class="source-tag">${k.source}</span>
    </div>`
    )
    .join("");
}

function renderTable(filter = "") {
  const q = filter.toLowerCase();
  const rows = snapshot.sites
    .filter((s) => s.named)
    .map((s) => ({ site: s, emp: employeeById.get(s.id) }))
    .filter(({ site, emp }) => {
      if (showOnlyWithEmployees && !emp?.employees && !emp?.employeesRange) return false;
      if (!q) return true;
      const hay = `${site.name} ${site.landuse ?? ""} ${emp?.source ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      const ae = a.emp?.employees != null ? 1 : 0;
      const be = b.emp?.employees != null ? 1 : 0;
      if (be !== ae) return be - ae;
      return a.site.name.localeCompare(b.site.name);
    });

  const tbody = document.getElementById("site-rows");
  tbody.innerHTML = rows
    .map(
      ({ site: s, emp }) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td><span class="tag ${landuseClass(s.landuse)}">${escapeHtml(s.landuse ?? "—")}</span></td>
      <td class="emp-cell">${fmtEmployees(emp)}</td>
      <td><span class="scope-badge">${escapeHtml(scopeLabel(emp?.scope))}</span></td>
      <td><span class="conf-badge ${confClass(emp?.confidence)}">${escapeHtml(emp?.confidence ?? "unknown")}</span></td>
      <td class="source-cell" title="${escapeHtml(emp?.source ?? "")}">${escapeHtml((emp?.source ?? "—").slice(0, 48))}${(emp?.source?.length ?? 0) > 48 ? "…" : ""}</td>
    </tr>`
    )
    .join("");

  const count = document.getElementById("table-count");
  if (count) count.textContent = `${rows.length} rows`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initMap() {
  const bbox = snapshot.bbox;
  map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    center: [(bbox.west + bbox.east) / 2, (bbox.south + bbox.north) / 2],
    zoom: 10.8,
    attributionControl: true
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

  map.on("load", () => {
    const geojson = {
      type: "FeatureCollection",
      features: snapshot.sites.map((s) => {
        const emp = employeeById.get(s.id);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.lon, s.lat] },
          properties: {
            id: s.id,
            name: s.name,
            landuse: s.landuse,
            named: s.named,
            employees: emp?.employees ?? null,
            employeesRange: emp?.employeesRange ?? null,
            scope: emp?.scope ?? null,
            source: emp?.source ?? null,
            confidence: emp?.confidence ?? null
          }
        };
      })
    };

    map.addSource("gewerbe", { type: "geojson", data: geojson });

    map.addLayer({
      id: "gewerbe-glow",
      type: "circle",
      source: "gewerbe",
      paint: {
        "circle-radius": ["case", ["get", "named"], 7, 4],
        "circle-color": [
          "case",
          ["==", ["get", "confidence"], "predicted"],
          "#fbbf24",
          [">", ["coalesce", ["get", "employees"], 0], 0],
          "#34d399",
          ["has", "employeesRange"],
          "#a78bfa",
          [
            "match",
            ["get", "landuse"],
            "industrial",
            "#f59e0b",
            "commercial",
            "#38bdf8",
            "office",
            "#a78bfa",
            "retail",
            "#34d399",
            "#64748b"
          ]
        ],
        "circle-opacity": 0.55,
        "circle-blur": 0.4
      }
    });

    map.addLayer({
      id: "gewerbe-core",
      type: "circle",
      source: "gewerbe",
      paint: {
        "circle-radius": ["case", ["get", "named"], 4, 2],
        "circle-color": "#f8fafc",
        "circle-opacity": 0.85
      }
    });

    const anchors = [
      { ...BB_HUB, color: "#f59e0b", label: `BB Business Hub · ~${BB_HUB.employees} jobs` },
      { ...SEGRO, color: "#38bdf8", label: SEGRO.name }
    ];

    for (const a of anchors) {
      const el = document.createElement("div");
      el.className = "map-anchor";
      el.innerHTML = `<span style="background:${a.color}"></span>`;
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 12px " +
        a.color +
        ";background:" +
        a.color;

      new maplibregl.Marker({ element: el })
        .setLngLat([a.lon, a.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<strong>${a.label}</strong>`))
        .addTo(map);
    }

    map.fitBounds(
      [
        [bbox.west, bbox.south],
        [bbox.east, bbox.north]
      ],
      { padding: 48, maxZoom: 11.5 }
    );

    map.on("click", "gewerbe-core", (e) => {
      const p = e.features[0].properties;
      const emp = p.employees ? `~${Number(p.employees).toLocaleString()}${p.scope === "group" ? " (group)" : ""}` : p.employeesRange ?? "—";
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<strong>${escapeHtml(p.name)}</strong><br>` +
            `<span style="color:#94a3b8">${escapeHtml(p.landuse)}</span><br>` +
            `<span style="color:#34d399;margin-top:4px;display:inline-block">Employees: ${escapeHtml(emp)}</span>` +
            (p.source ? `<br><span style="font-size:11px;color:#64748b">${escapeHtml(p.source).slice(0, 80)}</span>` : "")
        )
        .addTo(map);
    });
    map.on("mouseenter", "gewerbe-core", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "gewerbe-core", () => {
      map.getCanvas().style.cursor = "";
    });
  });

  document.getElementById("map-meta").textContent = `${t("mapMeta")}: ${fmtDate(snapshot.fetchedAt)} · ${snapshot.summary.mappedSites} ${t("sites")}, ${snapshot.summary.namedSites} ${t("named")}`;
}

function renderPilot() {
  const chips = document.getElementById("anchor-chips");
  chips.innerHTML = sources.pilot.anchors.map((a) => `<span>${escapeHtml(a)}</span>`).join("");
}

async function main() {
  try {
    await loadData();
    document.getElementById("loading").hidden = true;
    document.getElementById("content").hidden = false;

    applyLang();
    renderCrossrefBanner();
    renderKpis();
    renderTable();
    renderPilot();
    initMap();

    document.getElementById("site-search").addEventListener("input", (e) => {
      renderTable(e.target.value);
    });

    document.getElementById("filter-employees").addEventListener("change", (e) => {
      showOnlyWithEmployees = e.target.checked;
      renderTable(document.getElementById("site-search").value);
    });

    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => {
        lang = btn.dataset.lang;
        applyLang();
        renderCrossrefBanner();
        renderKpis();
        renderTable(document.getElementById("site-search").value);
        document.getElementById("map-meta").textContent = `${t("mapMeta")}: ${fmtDate(snapshot.fetchedAt)} · ${snapshot.summary.mappedSites} ${t("sites")}, ${snapshot.summary.namedSites} ${t("named")}`;
      });
    });

    document.getElementById("footer-sources").innerHTML = `
      OpenStreetMap / Overpass (${fmtDate(snapshot.fetchedAt)}) ·
      ${sources.bbBusinessHub.source} (${sources.bbBusinessHub.sourceDate}) ·
      ${sources.labourStudy.title} (${sources.labourStudy.publishers.join(", ")}) ·
      <a href="https://ber-board-room.vercel.app/" target="_blank" rel="noopener">BER+ Board Room</a>
    `;
  } catch (e) {
    document.getElementById("loading").textContent = "Failed to load data. Run: node fetch-data.mjs";
    console.error(e);
  }
}

main();
