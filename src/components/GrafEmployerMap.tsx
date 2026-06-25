"use client";

import { useEffect, useRef, useState } from "react";
import type { GrafEmployeeRecord } from "@/lib/graf-briefing";
import { CARTO_DARK_FALLBACK_STYLE } from "@/lib/war-room-map-style";

const BB_HUB = { lon: 13.512, lat: 52.388, label: "BB Business Hub · ~800" };

export type GrafMapSite = {
  id: string;
  lat: number;
  lon: number;
  named?: boolean;
  name?: string | null;
};

type Props = {
  employers: GrafEmployeeRecord[];
  backgroundSites?: GrafMapSite[];
  className?: string;
};

export function GrafEmployerMap({ employers, backgroundSites = [], className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || employers.length === 0) return;

    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const addLayers = (m: import("maplibre-gl").Map, ml: typeof import("maplibre-gl")) => {
      const employerById = new Map(employers.map((e) => [e.id, e]));

      const bgFeatures: GeoJSON.Feature[] = backgroundSites
        .filter((s) => s.lat != null && s.lon != null)
        .map((s) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.lon, s.lat] },
          properties: { id: s.id, named: s.named ? 1 : 0 }
        }));

      if (bgFeatures.length > 0) {
        m.addSource("osm-all", {
          type: "geojson",
          data: { type: "FeatureCollection", features: bgFeatures }
        });
        m.addLayer({
          id: "osm-all-dots",
          type: "circle",
          source: "osm-all",
          paint: {
            "circle-radius": ["case", ["==", ["get", "named"], 1], 4, 2.5],
            "circle-color": ["case", ["==", ["get", "named"], 1], "#475569", "#334155"],
            "circle-opacity": 0.45
          }
        });
      }

      const employerFeatures: GeoJSON.Feature[] = employers
        .filter((s) => s.lat != null && s.lon != null)
        .map((s) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.lon, s.lat] },
          properties: {
            id: s.id,
            name: s.name,
            employees: s.employees,
            confidence: s.confidence,
            landuse: s.landuse,
            range: s.employeesRange
          }
        }));

      m.addSource("gewerbe", {
        type: "geojson",
        data: { type: "FeatureCollection", features: employerFeatures }
      });
      m.addLayer({
        id: "gewerbe-glow",
        type: "circle",
        source: "gewerbe",
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "case",
            ["==", ["get", "confidence"], "predicted"],
            "#fbbf24",
            [">", ["coalesce", ["get", "employees"], 0], 0],
            "#34d399",
            "#94a3b8"
          ],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0f172a"
        }
      });

      new ml.Marker({ color: "#f59e0b" })
        .setLngLat([BB_HUB.lon, BB_HUB.lat])
        .setPopup(new ml.Popup({ offset: 12 }).setHTML(`<strong>${BB_HUB.label}</strong>`))
        .addTo(m);

      m.fitBounds(
        [
          [13.42, 52.32],
          [13.62, 52.42]
        ],
        { padding: 48, maxZoom: 11.4, duration: 0 }
      );

      m.on("click", "gewerbe-glow", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as {
          name: string;
          employees?: number;
          landuse?: string;
          confidence?: string;
          range?: string;
        };
        const rec = employerById.get(String((f.properties as { id?: string }).id));
        const emp =
          p.employees != null
            ? `~${Number(p.employees).toLocaleString()}${p.confidence === "predicted" ? " †" : ""}`
            : "—";
        const range = p.range ? `<br/>Range: ${p.range}` : "";
        const method =
          rec?.prediction?.prior
            ? `<br/><span style="color:#94a3b8;font-size:11px">Prior: ${rec.prediction.prior}</span>`
            : "";
        new ml.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${p.name}</strong><br/><span style="color:#94a3b8">${p.landuse ?? ""}</span><br/>Employees: ${emp}${range}${method}`
          )
          .addTo(m);
      });
      m.on("mouseenter", "gewerbe-glow", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "gewerbe-glow", () => {
        m.getCanvas().style.cursor = "";
      });
    };

    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        map = new ml.Map({
          container: containerRef.current,
          style: CARTO_DARK_FALLBACK_STYLE,
          center: [13.52, 52.37],
          zoom: 10.6,
          attributionControl: { compact: true }
        });
        mapRef.current = map;

        map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

        map.on("error", () => {
          if (!cancelled) setStatus("error");
        });

        const onReady = () => {
          if (cancelled || !map) return;
          map.resize();
          if (!map.getSource("gewerbe")) addLayers(map, ml);
          setStatus("ready");
        };

        if (map.isStyleLoaded()) onReady();
        else map.once("load", onReady);

        resizeObserver = new ResizeObserver(() => map?.resize());
        resizeObserver.observe(container);

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) map?.resize();
          },
          { threshold: 0.1 }
        );
        intersectionObserver.observe(container);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      map?.remove();
      map = null;
      mapRef.current = null;
    };
  }, [employers, backgroundSites]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        data-testid="graf-briefing-map"
        className={`h-[min(440px,55vh)] min-h-[280px] w-full rounded-xl bg-ink-900 ${className}`}
        role="img"
        aria-label="Employer density map near Schönefeld"
      />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-ink-900/80 text-sm text-white/50">
          Loading map…
        </div>
      ) : null}
      {status === "error" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-amber-200/80">
          Map tiles blocked — points may still load on retry
        </div>
      ) : null}
    </div>
  );
}
