# BER+ Coordination Hub (Next.js PWA)

Coordination map for the Flughafenregion — matching, visibility, OSM intel, and member asset links.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3001` (port **3001** — 3000 is often used by other projects).

**Stuck on “Offline” page?** A cached service worker from an old build can cause this on localhost. Open [http://localhost:3001/clear-sw.html](http://localhost:3001/clear-sw.html) or DevTools → Application → Service Workers → Unregister, then hard-refresh. The app disables SW automatically on localhost in dev.

**“Failed to read a RSC payload… development version on the server / production version on the client”?** The browser is using **old production JavaScript** while the dev server sends **dev** React. That happens if you switched between `npm run build && npm run start` and `npm run dev` on the same port, or the browser cached `/_next/static` chunks.

1. Stop every process on port 3001 (close other terminals / `next start` instances).
2. Run a clean dev server: `npm run dev:fresh`
3. Open [http://localhost:3001/clear-sw.html](http://localhost:3001/clear-sw.html) once, then hard-refresh the map (`Ctrl+Shift+R`).
4. Use **only** `npm run dev` while developing — use `npm run build` + `npm run start` only to test production locally.

## Stakeholder UX tests (Playwright)

Automated screenshots + assertions for each board-room persona (company, investor, municipality, explore):

```bash
npm run dev:fresh          # fix stale .next / module errors
npm run test:ux            # desktop + mobile
npm run test:ux -- --project=desktop
```

Screenshots land in `e2e/screenshots/{persona}/`. HTML report: `e2e/report/`.

## June 12 presentation (IDI S26)

- **Strategic framing:** left tab **Coordination** — problem → solution, member paths, pilot steps
- **Member paths:** select a Mitglied → right **Member path** panel (problem → see → do)
- **LaTeX slides:** `docs/presentation/june12-final.tex`
- **Screenshots:** `http://localhost:3000/capture` or `npm run presentation:screenshots` → `docs/presentation/figures/`

## Intelligence TV (map overlay)

Bottom-right **BER+ Intelligence** widget on the coordination map:

- Aggregates ~25 German RSS feeds ([Feedspot list](https://rss.feedspot.com/german_news_rss_feeds/)) + YouTube (BER, DW, tagesschau)
- Filters by BER+ corridor keywords (`src/lib/ber-topics.ts`)
- API: `GET /api/intelligence` (10 min cache)

## Configure RSS sources

Edit `src/lib/feeds.ts` to add/remove feeds or YouTube `channel_id` values.

## Map data

Draft corridor + Pilot-1 overlays live in `src/data/ber-corridor.geojson`.
Replace with your own OSM-derived corridor geometry when ready.

## Mitglieder (members)

Official menu URLs: `src/data/ber-plus-members-menu.ts` (synced with ber-plus.de nav).

Member profiles and map placements: `src/data/mitglieder.ts`.

- War room map: click markers or list items
- Directory: `/mitglieder`
- API: `/api/mitglieder`

Coordinates are **draft** corridor placements for briefing — replace with verified GIS when available.

