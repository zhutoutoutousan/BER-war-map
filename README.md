# BER+ war-room map (Next.js PWA)

War-room style strategic map + RSS “intelligence” feed for the BER+ corridor.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3001` (port **3001** — 3000 is often used by other projects).

**Stuck on “Offline” page?** A cached service worker from an old build can cause this on localhost. Click **Clear cached app & reload** on that page, or open DevTools → Application → Service Workers → Unregister, then hard-refresh. The app disables SW automatically on localhost in dev.

## June 12 presentation (IDI S26)

- **Strategic framing:** left tab **BER+ Paths** — coordination problems, why now, 12–24 month steps
- **Member paths:** select a Mitglied → right **Member path** panel (problem → see → do)
- **LaTeX slides:** `docs/presentation/june12-final.tex`
- **Screenshots:** `http://localhost:3000/capture` or `npm run presentation:screenshots` → `docs/presentation/figures/`

## Intelligence TV (map overlay)

Bottom-right **BER+ Intelligence** widget on the war-room map:

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

