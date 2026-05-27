import Parser from "rss-parser";
import { FEED_SOURCES, type FeedSource } from "./feeds";

export type NewsItem = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  title: string;
  link: string;
  isoDate?: string;
  summary?: string;
};

type CacheEntry = {
  expiresAt: number;
  items: NewsItem[];
  errors: { sourceId: string; message: string }[];
};

const CACHE_KEY = "__ber_news_cache_v1__";
const TTL_MS = 10 * 60 * 1000;

const globalCache = globalThis as typeof globalThis & { [CACHE_KEY]?: CacheEntry };

function getCache(): CacheEntry | null {
  const entry = globalCache[CACHE_KEY];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry;
}

function setCache(entry: CacheEntry) {
  globalCache[CACHE_KEY] = entry;
}

function normalizeText(s: string | undefined | null) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function pickLink(item: { link?: string; guid?: string }) {
  const link = normalizeText(item.link);
  if (link) return link;
  const guid = normalizeText(item.guid);
  if (guid.startsWith("http://") || guid.startsWith("https://")) return guid;
  return "";
}

function toItem(source: FeedSource, raw: Parser.Item): NewsItem | null {
  const title = normalizeText(raw.title);
  const link = pickLink(raw);
  if (!title || !link) return null;

  const isoDate = normalizeText(raw.isoDate ?? raw.pubDate);
  const summary = normalizeText(raw.contentSnippet ?? raw.summary ?? raw.content);
  const id = `${source.id}:${normalizeText(raw.guid) || link}`;

  return {
    id,
    sourceId: source.id,
    sourceLabel: source.label,
    title,
    link,
    isoDate: isoDate || undefined,
    summary: summary || undefined
  };
}

async function fetchFeed(source: FeedSource) {
  const res = await fetch(source.url, {
    headers: {
      "user-agent": "BER-war-map/0.1 (+https://www.ber-plus.de/)",
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
    },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  const parser = new Parser();
  return await parser.parseString(text);
}

export async function getNewsAggregate(sources: FeedSource[] = FEED_SOURCES) {
  const cached = getCache();
  if (cached) return cached;

  const errors: CacheEntry["errors"] = [];
  const allItems: NewsItem[] = [];

  await Promise.all(
    sources.map(async (source) => {
      try {
        const feed = await fetchFeed(source);
        for (const raw of feed.items ?? []) {
          const item = toItem(source, raw);
          if (item) allItems.push(item);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        errors.push({ sourceId: source.id, message: msg });
      }
    })
  );

  allItems.sort((a, b) => (b.isoDate ?? "").localeCompare(a.isoDate ?? ""));

  const entry: CacheEntry = {
    expiresAt: Date.now() + TTL_MS,
    items: allItems.slice(0, 200),
    errors
  };
  setCache(entry);
  return entry;
}

