"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { getMitgliedById } from "@/data/mitglieder";
import type { CorridorGraph } from "@/lib/member-asset-graph";
import { buildMatchBrief } from "@/lib/matching-match-brief";
import { findLiveMatchForGraphNode } from "@/lib/matching-node-match";
import { resolveMatchingNodePreview } from "@/lib/matching-node-geo";
import { recordSwipeDecision, savedCount } from "@/lib/matching-swipe-store";
import { CARTO_DARK_STYLE } from "@/lib/war-room-map-style";
import { MatchReviewCard, SwipeActionButtons } from "@/components/MatchReviewCard";

const SWIPE_THRESHOLD = 72;

type Props = {
  nodeId: string;
  graph: CorridorGraph;
  focusMemberId?: string | null;
  onClose: () => void;
  onOpenFullMap?: (nodeId: string) => void;
  onSavedChange?: (count: number) => void;
};

export function MatchingNodeMapPopup({
  nodeId,
  graph,
  focusMemberId,
  onClose,
  onOpenFullMap,
  onSavedChange
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const { data: osmData } = useOsmIntel();
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);
  const pointerRef = useRef<{ x: number; y: number; active: boolean } | null>(null);

  const preview = useMemo(
    () => resolveMatchingNodePreview(nodeId, graph, osmData),
    [nodeId, graph, osmData]
  );

  const liveMatch = useMemo(() => {
    if (!focusMemberId) return null;
    return findLiveMatchForGraphNode(nodeId, focusMemberId, graph, osmData);
  }, [nodeId, focusMemberId, graph, osmData]);

  const brief = useMemo(() => {
    if (!liveMatch || !focusMemberId) return null;
    return buildMatchBrief(liveMatch, focusMemberId, osmData?.geojson ?? null);
  }, [liveMatch, focusMemberId, osmData?.geojson]);

  const viewer = focusMemberId ? getMitgliedById(focusMemberId) : null;
  const showReview = Boolean(focusMemberId && liveMatch && brief);

  const handleDecision = useCallback(
    (decision: "saved" | "passed") => {
      if (!liveMatch || !focusMemberId) return;
      recordSwipeDecision(focusMemberId, liveMatch.id, decision);
      onSavedChange?.(savedCount(focusMemberId));
      onClose();
    },
    [liveMatch, focusMemberId, onClose, onSavedChange]
  );

  const flyOut = useCallback(
    (dir: "left" | "right") => {
      setAnimating(dir);
      window.setTimeout(() => {
        handleDecision(dir === "right" ? "saved" : "passed");
        setAnimating(null);
        setDragX(0);
      }, 220);
    },
    [handleDecision]
  );

  useEffect(() => {
    if (!preview || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: CARTO_DARK_STYLE,
        center: preview.center,
        zoom: preview.zoom - 0.8,
        pitch: 42,
        bearing: -18,
        attributionControl: { compact: true },
        interactive: true
      });

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        map.resize();

        if (preview.feature) {
          const fc: GeoJSON.FeatureCollection = {
            type: "FeatureCollection",
            features: [preview.feature]
          };
          map.addSource("preview-highlight", { type: "geojson", data: fc });
          map.addLayer({
            id: "preview-fill",
            type: "fill",
            source: "preview-highlight",
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: { "fill-color": "#f59e0b", "fill-opacity": 0.28 }
          });
          map.addLayer({
            id: "preview-line",
            type: "line",
            source: "preview-highlight",
            filter: ["any", ["==", ["geometry-type"], "LineString"], ["==", ["geometry-type"], "Polygon"]],
            paint: { "line-color": "#fbbf24", "line-width": 2.5 }
          });
          map.addLayer({
            id: "preview-point",
            type: "circle",
            source: "preview-highlight",
            filter: ["==", ["geometry-type"], "Point"],
            paint: {
              "circle-radius": 10,
              "circle-color": "#f59e0b",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff"
            }
          });

          const bounds = new maplibre.LngLatBounds();
          const extend = (coords: unknown): void => {
            if (!Array.isArray(coords)) return;
            if (typeof coords[0] === "number" && typeof coords[1] === "number") {
              bounds.extend(coords as [number, number]);
              return;
            }
            for (const c of coords) extend(c);
          };
          const geom = preview.feature.geometry;
          if (geom.type === "Point") bounds.extend(geom.coordinates as [number, number]);
          else if ("coordinates" in geom) extend(geom.coordinates);

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 0 });
          }
        }

        map.flyTo({
          center: preview.center,
          zoom: preview.zoom,
          pitch: 42,
          duration: 700,
          essential: true
        });
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [preview]);

  if (!preview || typeof document === "undefined") return null;

  const rotate = dragX * 0.04;
  const tx = animating === "left" ? -320 : animating === "right" ? 320 : dragX;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close preview"
        className="fixed inset-0 z-[55] bg-black/60 touch-none"
        onClick={onClose}
      />
      <div
        className={`pointer-events-auto fixed z-[56] flex max-h-[min(90dvh,720px)] flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-ink-900/98 shadow-2xl backdrop-blur-md ${
          showReview
            ? "inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] sm:inset-x-4 md:left-1/2 md:w-[min(96vw,920px)] md:-translate-x-1/2"
            : "inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] sm:inset-x-auto sm:left-1/2 sm:w-[min(100vw-2rem,420px)] sm:-translate-x-1/2"
        }`}
        role="dialog"
        aria-modal="true"
        data-testid="matching-node-map-popup"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/10 px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-200/90">
              {showReview ? "Match review · geo" : "Geo preview"}
            </div>
            <h3 className="truncate text-sm font-semibold text-white">{preview.title}</h3>
            {viewer ? (
              <p className="mt-0.5 text-[11px] text-white/55">
                For {viewer.shortName}
                {showReview ? " · swipe or tap Pass / Save" : ""}
              </p>
            ) : preview.subtitle ? (
              <p className="mt-0.5 text-[11px] text-white/55">{preview.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] shrink-0 rounded-lg px-3 text-xs text-white/60 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div
          className={`grid min-h-0 flex-1 ${showReview ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
        >
          <div
            ref={containerRef}
            className={`min-h-[200px] w-full shrink-0 border-white/10 md:min-h-[280px] ${
              showReview ? "h-[min(36dvh,240px)] border-b md:h-auto md:border-b-0 md:border-r" : "h-[min(42dvh,280px)]"
            }`}
            data-testid="matching-node-embed-map"
          />

          {showReview && liveMatch && brief ? (
            <div className="flex min-h-0 flex-col">
              <div
                className="relative min-h-0 flex-1 touch-none select-none overflow-hidden p-2 sm:p-3"
                onPointerDown={(e) => {
                  if (animating) return;
                  pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const p = pointerRef.current;
                  if (!p?.active || animating) return;
                  setDragX(e.clientX - p.x);
                }}
                onPointerUp={() => {
                  const p = pointerRef.current;
                  if (!p?.active || animating) return;
                  pointerRef.current = null;
                  if (dragX > SWIPE_THRESHOLD) flyOut("right");
                  else if (dragX < -SWIPE_THRESHOLD) flyOut("left");
                  else setDragX(0);
                }}
                onPointerCancel={() => {
                  pointerRef.current = null;
                  setDragX(0);
                }}
                onClick={(e) => {
                  if (Math.abs(dragX) > 8 || animating) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = e.clientX - rect.left;
                  if (relX < rect.width / 2) flyOut("left");
                  else flyOut("right");
                }}
              >
                <div
                  className="war-room-scroll max-h-[min(40dvh,360px)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/15 bg-gradient-to-b from-ink-900 to-black p-3 transition-transform duration-200 md:max-h-none md:min-h-[240px]"
                  style={{
                    transform: `translateX(${tx}px) rotate(${rotate}deg)`,
                    opacity: animating ? 0 : 1,
                    boxShadow:
                      dragX > 40
                        ? "0 0 32px rgba(16,185,129,0.35)"
                        : dragX < -40
                          ? "0 0 32px rgba(248,113,113,0.35)"
                          : undefined
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {dragX > 40 ? (
                    <span className="mb-2 inline-block rounded border-2 border-emerald-400 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      SAVE
                    </span>
                  ) : null}
                  {dragX < -40 ? (
                    <span className="mb-2 inline-block rounded border-2 border-red-400 px-2 py-0.5 text-xs font-bold text-red-400">
                      PASS
                    </span>
                  ) : null}
                  <MatchReviewCard match={liveMatch} brief={brief} memberId={focusMemberId!} compact />
                </div>
              </div>
              <div className="shrink-0 border-t border-white/10 p-2 sm:p-3">
                <SwipeActionButtons onPass={() => flyOut("left")} onSave={() => flyOut("right")} />
              </div>
            </div>
          ) : preview.detail ? (
            <p className="border-t border-white/10 p-3 text-[11px] leading-relaxed text-white/60 md:border-t-0 md:border-l">
              {preview.detail}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-white/10 p-3">
          {onOpenFullMap ? (
            <button
              type="button"
              onClick={() => onOpenFullMap(preview.nodeId)}
              className="min-h-[44px] flex-1 rounded-lg bg-sky-500/25 text-xs font-medium text-sky-100 touch-manipulation hover:bg-sky-500/35"
            >
              Open full war-room map
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg bg-white/10 px-4 text-xs font-medium text-white/80 touch-manipulation hover:bg-white/15"
          >
            Stay on matching map
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
