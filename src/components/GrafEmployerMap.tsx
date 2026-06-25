"use client";

import { useEffect, useRef } from "react";
import type { GrafEmployeeRecord } from "@/lib/graf-briefing";

const BB_HUB = { lon: 13.512, lat: 52.388, label: "BB Business Hub · ~800" };

type Props = {
  sites: GrafEmployeeRecord[];
  className?: string;
};

export function GrafEmployerMap({ sites, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || sites.length === 0) return;

    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [13.52, 52.37],
        zoom: 10.6
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        const geojson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: sites
            .filter((s) => s.lat != null && s.lon != null)
            .map((s) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [s.lon, s.lat] },
              properties: {
                name: s.name,
                employees: s.employees,
                confidence: s.confidence,
                landuse: s.landuse
              }
            }))
        };

        map.addSource("gewerbe", { type: "geojson", data: geojson });
        map.addLayer({
          id: "gewerbe-glow",
          type: "circle",
          source: "gewerbe",
          paint: {
            "circle-radius": 6,
            "circle-color": [
              "case",
              ["==", ["get", "confidence"], "predicted"],
              "#fbbf24",
              [">", ["coalesce", ["get", "employees"], 0], 0],
              "#34d399",
              "#64748b"
            ],
            "circle-opacity": 0.65,
            "circle-blur": 0.35
          }
        });

        new maplibregl.Marker({ color: "#f59e0b" })
          .setLngLat([BB_HUB.lon, BB_HUB.lat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<strong>${BB_HUB.label}</strong>`))
          .addTo(map);

        map.fitBounds(
          [
            [13.42, 52.32],
            [13.62, 52.42]
          ],
          { padding: 40, maxZoom: 11.2 }
        );

        map.on("click", "gewerbe-glow", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties as { name: string; employees?: number; landuse?: string };
          const emp = p.employees ? `~${Number(p.employees).toLocaleString()}` : "—";
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${p.name}</strong><br/><span style="color:#94a3b8">${p.landuse ?? ""}</span><br/>Employees: ${emp}`)
            .addTo(map);
        });
        map.on("mouseenter", "gewerbe-glow", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "gewerbe-glow", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [sites]);

  return (
    <div
      ref={containerRef}
      data-testid="graf-briefing-map"
      className={`h-[min(420px,50vh)] w-full rounded-xl ${className}`}
      role="img"
      aria-label="Employer density map near Schönefeld"
    />
  );
}
