"use client";

import { useEffect, useMemo, useState } from "react";
import type { CctvFeed } from "@/data/cctv-feeds";
import { useCctv } from "@/context/CctvContext";
import { OPENCCTV_MAP_URL } from "@/lib/opencctv";

function proxyImage(url: string) {
  return `/api/cctv/proxy?url=${encodeURIComponent(url)}`;
}

function shouldProxyImage(url: string) {
  try {
    const host = new URL(url).hostname;
    return (
      host.includes("autobahn.de") ||
      host.includes("windy.com") ||
      host.includes("rbb-online.de") ||
      host.includes("inselhotel-potsdam.de") ||
      host.includes("phenocam.nau.edu")
    );
  } catch {
    return false;
  }
}

function imageSrc(url: string) {
  return shouldProxyImage(url) ? proxyImage(url) : url;
}

export function CctvPanel() {
  const { loading, data, selectedCameraId, selectCamera } = useCctv();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<string>("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [imgKey, setImgKey] = useState(0);

  const autobahn = data?.autobahn ?? [];
  const opencctv = data?.opencctv ?? [];
  const curated = data?.curated ?? [];
  const totalOnMap = data?.totalMapCameras ?? 0;

  useEffect(() => {
    if (selectedCameraId) setSource(selectedCameraId);
  }, [selectedCameraId]);

  useEffect(() => {
    if (source || !data) return;
    const first =
      data.autobahn.length > 0
        ? `autobahn-${data.autobahn[0].id}`
        : data.opencctv.find((c) => c.feedType === "image")
          ? `opencctv-${data.opencctv.find((c) => c.feedType === "image")!.id}`
          : data.curated[0]?.id ?? "";
    if (first) setSource(first);
  }, [data, source]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items: { id: string; label: string; category: string; distanceKm: number }[] = [];

    for (const cam of autobahn) {
      if (category !== "all" && category !== "traffic") continue;
      if (q && !cam.title.toLowerCase().includes(q) && !cam.road.toLowerCase().includes(q)) continue;
      items.push({
        id: `autobahn-${cam.id}`,
        label: `${cam.road} — ${cam.title}`,
        category: "traffic",
        distanceKm: cam.distanceKm
      });
    }
    for (const cam of opencctv) {
      if (category !== "all" && cam.category !== category) continue;
      if (q && !cam.name.toLowerCase().includes(q) && !(cam.city?.toLowerCase().includes(q) ?? false))
        continue;
      items.push({
        id: `opencctv-${cam.id}`,
        label: cam.name,
        category: cam.category,
        distanceKm: cam.distanceKm
      });
    }

    return items.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 48);
  }, [autobahn, opencctv, search, category]);

  const activeAutobahn = source.startsWith("autobahn-")
    ? autobahn.find((c) => `autobahn-${c.id}` === source)
    : undefined;
  const activeOpenCctv = source.startsWith("opencctv-")
    ? opencctv.find((c) => `opencctv-${c.id}` === source)
    : undefined;
  const activeCurated = curated.find((c) => c.id === source);

  const activeImageUrl =
    activeAutobahn?.imageUrl ?? (activeOpenCctv?.feedType === "image" ? activeOpenCctv.imageUrl : undefined);
  const refreshMs = activeOpenCctv?.updateRateMs ?? 60_000;

  useEffect(() => {
    if (!activeImageUrl) return;
    const t = setInterval(() => setImgKey((k) => k + 1), Math.max(refreshMs, 30_000));
    return () => clearInterval(t);
  }, [activeImageUrl, refreshMs]);

  const pickSource = (id: string) => {
    setSource(id);
    if (id.startsWith("autobahn-") || id.startsWith("opencctv-")) selectCamera(id);
    else selectCamera(null);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cctv-panel-collapsed pointer-events-auto flex items-center gap-2 rounded-lg border border-cyan-500/35 bg-black/80 px-3 py-2 text-xs font-medium text-cyan-100 shadow-lg backdrop-blur-md"
      >
        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
        CCTV · Map
        {totalOnMap ? (
          <span className="rounded bg-fuchsia-500/25 px-1.5 py-px text-[10px] text-fuchsia-100">
            {totalOnMap}
          </span>
        ) : loading ? (
          <span className="text-[10px] text-white/40">…</span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="cctv-panel pointer-events-auto w-[min(420px,calc(100vw-1.5rem))]">
      <div className="floating-panel overflow-hidden border-cyan-500/20">
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-950 to-cyan-950/40 px-3 py-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
              Public feeds
            </div>
            <div className="text-xs font-semibold text-white">
              CCTV · {totalOnMap.toLocaleString()} on map
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded px-2 py-0.5 text-xs text-white/50 hover:bg-white/10 hover:text-white"
          >
            —
          </button>
        </div>

        <div className="war-room-scroll max-h-[min(52vh,480px)] overflow-y-auto p-3">
          <p className="mb-3 text-[11px] leading-relaxed text-white/55">{data?.note}</p>

          {loading ? (
            <div className="py-8 text-center text-xs text-white/50">Loading Germany camera index…</div>
          ) : (
            <>
              <div className="mb-3 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-2 text-[11px] text-fuchsia-100/90">
                <strong>{totalOnMap.toLocaleString()}</strong> cameras on the map (Germany, via{" "}
                <a href={OPENCCTV_MAP_URL} target="_blank" rel="noreferrer" className="underline">
                  opencctv.org
                </a>
                {autobahn.length ? ` + ${autobahn.length} Autobahn` : ""}). Zoom in on clusters; click a
                marker to preview.
              </div>

              <div className="mb-3 space-y-2">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cameras…"
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-white/35"
                />
                <div className="flex flex-wrap gap-1">
                  {["all", "traffic", "airport", "weather", "water", "nature"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded px-2 py-0.5 text-[10px] capitalize ${
                        category === cat
                          ? "bg-fuchsia-500/30 text-fuchsia-100"
                          : "bg-white/5 text-white/55 hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-1">
                  {filteredList.length ? (
                    filteredList.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => pickSource(item.id)}
                          className={`w-full rounded px-2 py-1 text-left text-[10px] ${
                            source === item.id
                              ? "bg-fuchsia-500/25 text-fuchsia-100"
                              : "text-white/65 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-white/40">{item.distanceKm} km · </span>
                          {item.label}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-2 text-center text-[10px] text-white/45">No matches</li>
                  )}
                </ul>
              </div>

              <div className="mb-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  Curated monitors
                </div>
                <div className="flex flex-wrap gap-1">
                  {curated.map((feed) => (
                    <button
                      key={feed.id}
                      type="button"
                      onClick={() => pickSource(feed.id)}
                      className={`rounded px-2 py-1 text-[10px] ${
                        source === feed.id
                          ? "bg-sky-500/30 text-sky-100"
                          : "bg-white/5 text-white/55 hover:bg-white/10"
                      }`}
                    >
                      {feed.name.split("—")[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cctv-viewer overflow-hidden rounded-lg border border-white/10 bg-black">
                {activeAutobahn ? (
                  <ImageViewer
                    key={`${activeAutobahn.id}-${imgKey}`}
                    src={imageSrc(activeAutobahn.imageUrl)}
                    alt={activeAutobahn.title}
                    badge={`LIVE · ${activeAutobahn.road}`}
                    title={activeAutobahn.title}
                    subtitle={activeAutobahn.subtitle}
                    operator="Autobahn GmbH"
                    distanceKm={activeAutobahn.distanceKm}
                    href={activeAutobahn.linkUrl ?? "https://verkehr.autobahn.de/"}
                  />
                ) : activeOpenCctv ? (
                  activeOpenCctv.feedType === "image" ? (
                    <ImageViewer
                      key={`${activeOpenCctv.id}-${imgKey}`}
                      src={imageSrc(activeOpenCctv.imageUrl)}
                      alt={activeOpenCctv.name}
                      badge={`${activeOpenCctv.category.toUpperCase()}`}
                      title={activeOpenCctv.name}
                      subtitle={[activeOpenCctv.city, activeOpenCctv.state].filter(Boolean).join(", ")}
                      operator={activeOpenCctv.source}
                      distanceKm={activeOpenCctv.distanceKm}
                      href={activeOpenCctv.pageUrl}
                    />
                  ) : (
                    <IframeViewer
                      src={activeOpenCctv.imageUrl}
                      title={activeOpenCctv.name}
                      subtitle={[activeOpenCctv.city, activeOpenCctv.category].filter(Boolean).join(" · ")}
                      operator={`opencctv · ${activeOpenCctv.source}`}
                      distanceKm={activeOpenCctv.distanceKm}
                      href={activeOpenCctv.pageUrl}
                    />
                  )
                ) : activeCurated ? (
                  <CuratedViewer feed={activeCurated} />
                ) : (
                  <div className="p-6 text-center text-xs text-white/50">
                    Click a camera on the map or pick from the list
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageViewer({
  src,
  alt,
  badge,
  title,
  subtitle,
  operator,
  distanceKm,
  href
}: {
  src: string;
  alt: string;
  badge: string;
  title: string;
  subtitle?: string;
  operator: string;
  distanceKm: number;
  href: string;
}) {
  return (
    <div>
      <div className="relative aspect-video bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
        <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-cyan-200">
          {badge}
        </div>
      </div>
      <FeedMeta title={title} subtitle={subtitle} operator={operator} distanceKm={distanceKm} href={href} />
    </div>
  );
}

function IframeViewer({
  src,
  title,
  subtitle,
  operator,
  distanceKm,
  href
}: {
  src: string;
  title: string;
  subtitle?: string;
  operator: string;
  distanceKm: number;
  href: string;
}) {
  return (
    <div>
      <div className="relative aspect-video bg-black">
        <iframe
          title={title}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <FeedMeta title={title} subtitle={subtitle} operator={operator} distanceKm={distanceKm} href={href} />
    </div>
  );
}

function CuratedViewer({ feed }: { feed: CctvFeed }) {
  if (feed.type === "iframe") {
    return (
      <IframeViewer
        src={feed.url}
        title={feed.name}
        subtitle={feed.subtitle}
        operator={feed.operator}
        distanceKm={feed.distanceKm ?? 0}
        href={feed.url}
      />
    );
  }

  return (
    <div className="p-4">
      <div className="text-sm font-medium text-white">{feed.name}</div>
      <p className="mt-2 text-xs text-white/65">{feed.description}</p>
      <a
        href={feed.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-xs text-sky-300 hover:text-sky-200"
      >
        Open feed ↗
      </a>
      <FeedMeta
        title={feed.name}
        subtitle={feed.subtitle}
        operator={feed.operator}
        distanceKm={feed.distanceKm}
        href={feed.url}
      />
    </div>
  );
}

function FeedMeta({
  title,
  subtitle,
  operator,
  distanceKm,
  href
}: {
  title: string;
  subtitle?: string;
  operator: string;
  distanceKm?: number;
  href: string;
}) {
  return (
    <div className="border-t border-white/10 bg-black/60 px-3 py-2">
      <div className="text-xs font-medium text-white">{title}</div>
      {subtitle ? <div className="text-[10px] text-white/50">{subtitle}</div> : null}
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
        <span>{operator}</span>
        {distanceKm != null ? <span>· {distanceKm} km from Schönefeld</span> : null}
        <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">
          Source ↗
        </a>
      </div>
    </div>
  );
}
