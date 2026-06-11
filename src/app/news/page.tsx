import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { getIntelligenceAggregate } from "@/lib/intelligence";
import { FEED_SOURCES } from "@/lib/feeds";

function prettyDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default async function NewsPage() {
  const { items, errors, stats } = await getIntelligenceAggregate(FEED_SOURCES);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-4">
        <div className="panel flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs tracking-wide text-white/60">Intelligence</div>
            <div className="text-lg font-semibold text-white">BER+ filtered news & video</div>
            <div className="text-sm text-white/65">
              {stats.matched} matches from {stats.fetched} headlines ·{" "}
              <a
                href="https://rss.feedspot.com/german_news_rss_feeds/"
                className="text-sky-200 hover:text-sky-100"
                target="_blank"
                rel="noreferrer"
              >
                Feedspot German sources
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
              {BRAND.mapLabel}
            </Link>
            <Link
              href="/api/intelligence"
              className="rounded-lg bg-sky-400/15 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-400/20"
            >
              JSON API
            </Link>
          </div>
        </div>

        {errors.length ? (
          <div className="panel p-4">
            <div className="text-sm font-semibold text-white">Feed errors ({errors.length})</div>
            <ul className="war-room-scroll mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-white/70">
              {errors.map((e) => (
                <li key={e.sourceId}>
                  <span className="font-medium text-white/85">{e.sourceId}</span>: {e.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">
              {stats.articles} articles · {stats.videos} videos
            </div>
          </div>

          <div className="mt-3 divide-y divide-white/10">
            {items.length ? (
              items.map((it) => (
                <div key={it.id} className="py-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-4">
                    <a
                      href={it.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-white hover:text-sky-100"
                    >
                      {it.type === "video" ? "▶ " : ""}
                      {it.title}
                    </a>
                    <div className="text-xs text-white/55">
                      {prettyDate(it.isoDate)} · score {it.relevanceScore}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">{it.sourceLabel}</div>
                  {it.summary ? <div className="mt-2 text-sm text-white/70">{it.summary}</div> : null}
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-white/60">No BER+ related items matched the current filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
