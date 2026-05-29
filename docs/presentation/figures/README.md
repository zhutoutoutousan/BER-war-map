# Presentation figures

Place PNG screenshots here for `june12-final.tex`:

| File | Content |
|------|---------|
| `fig01-war-room-overview.png` | Full map, BER+ Paths tab open |
| `fig02-coordination-paths.png` | Left panel — BER+ Paths / coordination themes |
| `fig03-mitglieder-matching.png` | Mitglieder list with OSM link counts |
| `fig04-osm-intel.png` | Map zoomed Schönefeld, OSM layers visible |
| `fig05-member-path.png` | Right panel — member selected (e.g. BUWOG) |
| `fig06-matching-review-popup.png` | Matching map: node click → embedded map + Pass/Save review (member focus) |
| `fig07-giant-matching-map.png` | Giant matching map — corridor overview or member focus (e.g. Taurecon fan) |
| `fig08-mobile-war-room.png` | Mobile viewport: bottom nav + sheet (390×844 or similar) |

## Capture (manual)

```bash
npm run dev
```

Open http://localhost:3001/capture and follow shot links. Use **1920×1080** for desktop figures (fig01–07), **390×844** (or DevTools iPhone) for fig08.

**Fig. 6–7 (matching map):**

1. Header → **Matching map** (or Member home → open giant map).
2. **Fig. 7:** Overview → pick a Mitglied chip (e.g. Taurecon) → wait for graph fan; or stay on overview with filters.
3. **Fig. 6:** Focus a member (e.g. GSG) → click a yellow OSM node → capture the **Match review · geo** modal (map + Pass/Save).

User-captured PNGs in this folder are valid for the deck; re-run automation only if you want refreshed pixels.

## Capture (automated)

```bash
npm run presentation:screenshots
```

Requires dev server on port **3001** (`npm run dev`). Captures fig01–05 and fig08; **does not overwrite** fig06–fig07 (manual / user shots).

## Compile PDF

```bash
cd docs/presentation
pdflatex june12-final.tex
pdflatex june12-final.tex
```

If figures are missing, LaTeX will warn — add PNGs or comment out `\includegraphics` lines temporarily.
