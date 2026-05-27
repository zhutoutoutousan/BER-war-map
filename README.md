# BER+ war-room map (Next.js PWA)

War-room style strategic map + RSS “intelligence” feed for the BER+ corridor.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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

