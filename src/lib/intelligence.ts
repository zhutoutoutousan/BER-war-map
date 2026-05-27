import Parser from "rss-parser";
import { MIN_RELEVANCE_SCORE, scoreBerRelevance } from "./ber-topics";
import { FEED_SOURCES, YOUTUBE_FEEDS, type FeedSource } from "./feeds";

export type IntelligenceItem = {
  id: string;
  type: "article" | "video";
  sourceId: string;
  sourceLabel: string;
  title: string;
  link: string;
  isoDate?: string;
  summary?: string;
  relevanceScore: number;
  videoId?: string;
  thumbnailUrl?: string;
};

type CacheEntry = {
  expiresAt: number;
  items: IntelligenceItem[];
  stats: IntelligenceStats;
  errors: { sourceId: string; message: string }[];
};

export type IntelligenceStats = {
  fetched: number;
  matched: number;
  articles: number;
  videos: number;
  sourcesOk: number;
  sourcesFailed: number;
};

const CACHE_KEY = "__ber_intelligence_cache_v1__";
const TTL_MS = 10 * 60 * 1000;

const globalCache = globalThis as typeof globalThis & { [CACHE_KEY]?: CacheEntry };

const parser = new Parser({
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["media:content", "mediaContent", { keepArray: true }]
    ]
  }
});

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

function extractYoutubeId(url: string): string | undefined {
  const m =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ??
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ??
    url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  return m?.[1];
}

function isYoutubeFeed(sourceId: string) {
  return sourceId.startsWith("yt-") || YOUTUBE_FEEDS.some((f) => f.id === sourceId);
}

function thumbnailForVideo(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

type RawItem = Parser.Item & {
  mediaThumbnail?: { $?: { url?: string } }[];
  mediaContent?: { $?: { url?: string } }[];
};

function toIntelligenceItem(source: FeedSource, raw: RawItem): IntelligenceItem | null {
  const title = normalizeText(raw.title);
  const link = pickLink(raw);
  if (!title || !link) return null;

  const summary = normalizeText(raw.contentSnippet ?? raw.summary ?? raw.content);
  const isoDate = normalizeText(raw.isoDate ?? raw.pubDate);
  const blob = `${title} ${summary} ${link}`;
  let relevanceScore = scoreBerRelevance(blob);
  if (source.regional && relevanceScore >= 1) relevanceScore += 1;

  if (relevanceScore < MIN_RELEVANCE_SCORE) return null;

  const youtubeFromLink = extractYoutubeId(link);
  const isVideo = isYoutubeFeed(source.id) || Boolean(youtubeFromLink);

  let videoId = youtubeFromLink;
  if (!videoId && isVideo) videoId = extractYoutubeId(link);

  const thumbFromMedia = raw.mediaThumbnail?.[0]?.$?.url ?? raw.mediaContent?.[0]?.$?.url;
  const thumbnailUrl =
    videoId ? thumbnailForVideo(videoId) : thumbFromMedia?.includes("http") ? thumbFromMedia : undefined;

  return {
    id: `${source.id}:${normalizeText(raw.guid) || link}`,
    type: isVideo ? "video" : "article",
    sourceId: source.id,
    sourceLabel: source.label,
    title,
    link,
    isoDate: isoDate || undefined,
    summary: summary || undefined,
    relevanceScore,
    videoId,
    thumbnailUrl
  };
}

async function fetchFeed(source: FeedSource) {
  const res = await fetch(source.url, {
    headers: {
      "user-agent": "BER-war-map/0.1 Intelligence (+https://www.ber-plus.de/)",
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return parser.parseString(text);
}

export async function getIntelligenceAggregate(sources: FeedSource[] = FEED_SOURCES) {
  const cached = globalCache[CACHE_KEY];
  if (cached && Date.now() < cached.expiresAt) return cached;

  const errors: CacheEntry["errors"] = [];
  const allItems: IntelligenceItem[] = [];
  let fetched = 0;
  let sourcesOk = 0;

  await Promise.all(
    sources.map(async (source) => {
      try {
        const feed = await fetchFeed(source);
        sourcesOk += 1;
        for (const raw of feed.items ?? []) {
          fetched += 1;
          const item = toIntelligenceItem(source, raw as RawItem);
          if (item) allItems.push(item);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        errors.push({ sourceId: source.id, message: msg });
      }
    })
  );

  allItems.sort((a, b) => {
    const date = (b.isoDate ?? "").localeCompare(a.isoDate ?? "");
    if (date !== 0) return date;
    return b.relevanceScore - a.relevanceScore;
  });

  const deduped = dedupeByLink(allItems).slice(0, 80);

  const stats: IntelligenceStats = {
    fetched,
    matched: deduped.length,
    articles: deduped.filter((i) => i.type === "article").length,
    videos: deduped.filter((i) => i.type === "video").length,
    sourcesOk,
    sourcesFailed: errors.length
  };

  const entry: CacheEntry = {
    expiresAt: Date.now() + TTL_MS,
    items: deduped,
    stats,
    errors
  };
  globalCache[CACHE_KEY] = entry;
  return entry;
}

function dedupeByLink(items: IntelligenceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.videoId ? `yt:${item.videoId}` : item.link.replace(/#.*$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
