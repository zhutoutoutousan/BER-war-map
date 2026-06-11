# June 12 presentation videos

Generates:

| Output | Description |
|--------|-------------|
| `out/ber-plus-june12-rehearsal.mp4` | **Desktop** 16:9 — full stage script, LaTeX slides, Yi / Qin / Tian voices |
| `out/ber-plus-june12-rehearsal-mobile.mp4` | **Phone rehearsal** 9:16 — **identical script & audio**, larger subs, vertical layout |
| `out/ber-plus-promo.mp4` | ~42s promo with demo montage + BGM |
| `stage-script.md` | Printable handout — same lines as video (中/EN/DE) |
| `demos/*.webm` | Playwright feature clips |

**Subtitles:** Chinese · English · German in parallel (ASS burned in).

**Speaking roles**

| Person | Voice (edge-tts) | Script style |
|--------|------------------|--------------|
| Tian Shao | `en-US-ChristopherNeural` (male) | Longer segments, native English |
| Yi Li | `en-US-BrianNeural` (male) | **More turns**, short lines |
| Qin Yushu | `en-US-AriaNeural` (female) | Medium segments |

Edit narration in `script.json` (fields `en`, `zh`, `de` per segment).

## Prerequisites

```bash
pip install edge-tts
npm install   # includes playwright, ffmpeg-static
npx playwright install chromium
```

Optional: replace generated ambient bed with your own stakeholder BGM:

`assets/bgm-stakeholder.mp3` (overwrites auto-generated pad).

## Quick start (production demos)

```bash
# Uses https://ber-war-map.vercel.app by default
npm run video:all
```

Local dev demos:

```bash
npm run dev
set BER_DEMO_URL=http://localhost:3001
npm run video:demos
npm run video:all
```

## Slide renders (LaTeX source of truth)

**Default:** compile `june12-final.tex` → PDF → PNG (matches Beamer deck exactly).

```bash
npm run video:slides
```

Requires **MiKTeX/TeX Live** (`pdflatex`) and **Poppler** (`pdftoppm`).

Page → video ID mapping: `slide-map.json` (18 frames, same order as `june12-final.tex`).

Fallback HTML renderer (legacy): `npm run video:slides:html`

## Rehearsal versions (same script)

Both use **`script.json`** end-to-end — 18 LaTeX slides, same TTS, same trilingual subtitles. Only the **frame layout** differs:

| Command | File | Use |
|---------|------|-----|
| `npm run video:rehearsal` | `ber-plus-june12-rehearsal.mp4` | Projector / laptop |
| `npm run video:rehearsal:mobile` | `ber-plus-june12-rehearsal-mobile.mp4` | **Phone rehearsal** on the way to the room |

Printable script: `npm run video:script:export` → `stage-script.md`

## Step by step

```bash
npm run video:demos      # Playwright → demos/
npm run video:slides      # LaTeX PDF → slides-rendered/ (matches june12-final.tex)
npm run video:tts        # edge-tts → audio/
npm run video:rehearsal         # desktop 16:9
npm run video:rehearsal:mobile  # phone 9:16, same script
npm run video:script:export     # stage-script.md
npm run video:promo             # ber-plus-promo.mp4
```

Partial rebuild:

```bash
set VIDEO_ONLY=tts,rehearsal
npm run video:all
```

## Slide ↔ video mapping

Each entry in `script.json` → `slides[]` matches `june12-final.tex` order.

Slides with `"demo": "demo-….webm"` insert the live feature clip instead of a static slide while narration plays.

## Presenters on June 12

Suggested live split (rehearsal video models this):

- **Yi** — openings, transitions, demo hand-offs (short English; subtitles carry detail)
- **Qin** — product sections (Mitglieder, match review, BER+ use cases)
- **Tian** — corridor framing, OSM/matching depth, summary & close

Thank-you slide: all three, natural order Yi → Qin → Tian.

## Brand

Logo in Beamer: Madrid/seahorse theme (title slide).  
Video slide PNGs come from **`pdflatex june12-final.tex`** — not `slides.html`.  
Optional HTML fallback: `slides.html` via `npm run video:slides:html`.

## Compile PDF only (no video)

```bash
cd docs/presentation
pdflatex june12-final.tex
pdflatex june12-final.tex
```

## Troubleshooting

- **ffmpeg not found:** `ffmpeg-static` is bundled via npm; reinstall dependencies.
- **TTS fails:** `pip install edge-tts` and ensure network access (Microsoft Edge TTS).
- **Demo timeout:** run against Vercel or wait for OSM graph to finish loading locally.
- **fig08 missing:** mobile slide falls back to war-room screenshot in `slides.html`.
