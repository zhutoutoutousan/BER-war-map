# Beschäftigungstiefe Briefing — Thomas Graf

Standalone HTML demo addressing **Thomas Graf's (Alpine Immobilien)** workforce question for the Schönefeld corridor.

## Build PDF report (Playwright + LaTeX)

```bash
npm run graf:report
# or: node build-report.mjs
```

Output: `report/graf-beschaeftigung-report.pdf`

## Open locally

```bash
cd demos/graf-beschaeftigung-briefing
npx serve . -p 3456
# → http://localhost:3456
```

Or any static server (`python -m http.server 3456`).

## Refresh real OSM data

```bash
node fetch-data.mjs
node enrich-employees.mjs
node predict-employees.mjs
```

`fetch-data.mjs` writes `data/corridor-snapshot.json` from Overpass.  
`enrich-employees.mjs` cross-references each named employer with `data/brand-employees.json` (Geschäftsbericht / Wikidata / press) → `data/employee-crossref.json`.

## Data sources

| Layer | Source |
|-------|--------|
| Gewerbe map | OpenStreetMap / Overpass API (live snapshot) |
| Employee cross-ref | `brand-employees.json` + `employee-crossref.json` (registry, Wikidata, press) |
| BB Business Hub | ~50 firms, ~800 employees — Alpine / BER+ member news (Feb 2025) |
| Labour context | FBB / WFBB / IHK Flughafenregion study 2025 |
| Catchment | Berlin–Brandenburg ~6M (indicative) |

All figures labelled **indicative** — OSM tags ≠ employee counts.

## Files

- `index.html` — briefing page (EN/DE)
- `styles.css` / `app.js` — presentation + MapLibre map
- `data/corridor-snapshot.json` — OSM snapshot
- `data/brand-employees.json` — curated corporate/site employee sources
- `data/employee-crossref.json` — per-site cross-reference output
- `data/sources.json` — cited member / study metadata
- `capture-screenshots.mjs` / `build-report.mjs` — Playwright figures + PDF
- `report/graf-beschaeftigung-report.tex` — business analysis (4 pages)
