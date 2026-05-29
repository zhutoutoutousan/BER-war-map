# Presentation figures

Place PNG screenshots here for `june12-final.tex`:

| File | Content |
|------|---------|
| `fig01-war-room-overview.png` | Full map, BER+ Paths tab open |
| `fig02-coordination-paths.png` | Left panel — BER+ Paths / coordination themes |
| `fig03-mitglieder-matching.png` | Mitglieder list with OSM link counts |
| `fig04-osm-intel.png` | Map zoomed Schönefeld, OSM layers visible |
| `fig05-member-path.png` | Right panel — member selected (e.g. BUWOG) |

## Capture (manual)

```bash
npm run dev
```

Open http://localhost:3001/capture and follow shot links. Use **1920×1080** or **1600×900** window, then:

- Windows: Win+Shift+S
- Or browser full-page screenshot extension

## Capture (automated, optional)

```bash
npm run presentation:screenshots
```

Requires dev server on port **3001** (`npm run dev` — script starts it if needed).

## Compile PDF

```bash
cd docs/presentation
pdflatex june12-final.tex
pdflatex june12-final.tex
```

If figures are missing, LaTeX will warn — add PNGs or comment out `\includegraphics` lines temporarily.
