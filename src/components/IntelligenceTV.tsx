"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntelligenceItem, IntelligenceStats } from "@/lib/intelligence";

type Payload = {
  items: IntelligenceItem[];
  stats: IntelligenceStats;
  errors: { sourceId: string; message: string }[];
  generatedAt: string;
};

const ROTATE_MS = 9_000;
const POLL_MS = 10 * 60 * 1000;

export function IntelligenceTV() {
  const [data, setData] = useState<Payload | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Payload;
      setData(json);
      setIndex(0);
    } catch {
      setData((prev) => prev ?? { items: [], stats: emptyStats(), errors: [], generatedAt: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    return () => clearInterval(poll);
  }, [load]);

  const items = data?.items ?? [];
  const current = items.length ? items[index % items.length] : null;

  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [items.length]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="intelligence-tv-collapsed pointer-events-auto flex items-center gap-2 rounded-lg border border-red-500/40 bg-black/80 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md"
      >
        <span className="live-pulse h-2 w-2 rounded-full bg-red-500" />
        BER+ TV · {items.length} signals
      </button>
    );
  }

  return (
    <div className="intelligence-tv pointer-events-auto w-[min(400px,calc(100vw-1.5rem))]">
      <div className="tv-bezel overflow-hidden rounded-lg border border-white/15 bg-black shadow-[0_0_48px_rgba(56,189,248,0.12)]">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-950 px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <span className="live-pulse h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/90">Live</span>
            <span className="text-[11px] font-semibold text-white/90">BER+ Intelligence</span>
          </div>
          <div className="flex items-center gap-1.5">
            {data?.stats ? (
              <span className="text-[9px] text-white/45">
                {data.stats.matched}/{data.stats.fetched} matched
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded px-1.5 py-0.5 text-[10px] text-white/40 hover:bg-white/10 hover:text-white/70"
            >
              —
            </button>
          </div>
        </div>

        {/* Screen */}
        <div className="tv-screen relative aspect-video w-full bg-[#0a0e14]">
          <div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-[0.07]" />

          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-white/50">Scanning feeds…</div>
          ) : !current ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center text-xs text-white/50">
              <span>No BER+ matches yet.</span>
              <span className="text-[10px] text-white/35">Filtering German news & YouTube</span>
            </div>
          ) : current.type === "video" && current.videoId ? (
            <iframe
              key={current.videoId}
              title={current.title}
              src={`https://www.youtube-nocookie.com/embed/${current.videoId}?autoplay=0&mute=1&rel=0&modestbranding=1`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : current.thumbnailUrl ? (
            <a href={current.link} target="_blank" rel="noreferrer" className="relative block h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            </a>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-950/40 to-black px-4">
              <span className="text-center text-sm font-medium text-white/80">{current.title}</span>
            </div>
          )}

          {/* Ticker overlay */}
          {current ? (
            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-sky-500/30 bg-black/85 px-2 py-1.5 backdrop-blur-sm">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span
                  className={`shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase ${
                    current.type === "video" ? "bg-red-500/25 text-red-200" : "bg-sky-500/25 text-sky-200"
                  }`}
                >
                  {current.type === "video" ? "▶ Video" : "News"}
                </span>
                <span className="truncate text-[9px] text-white/45">{current.sourceLabel}</span>
              </div>
              <a
                href={current.link}
                target="_blank"
                rel="noreferrer"
                className="tv-ticker block text-[11px] font-medium leading-snug text-white hover:text-sky-200"
              >
                {current.title}
              </a>
            </div>
          ) : null}
        </div>

        {/* Channel strip */}
        {items.length > 1 ? (
          <div className="war-room-scroll flex gap-1 overflow-x-auto border-t border-white/10 bg-black/90 p-1.5">
            {items.slice(0, 8).map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`shrink-0 rounded px-2 py-1 text-[9px] ${
                  i === index % items.length
                    ? "bg-sky-500/30 text-sky-100"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {item.type === "video" ? "▶" : "•"} {truncate(item.title, 28)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function emptyStats(): IntelligenceStats {
  return { fetched: 0, matched: 0, articles: 0, videos: 0, sourcesOk: 0, sourcesFailed: 0 };
}
