"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { employmentWeight, type GrafEmployeeRecord } from "@/lib/graf-briefing";
import { CARTO_DARK_FALLBACK_STYLE } from "@/lib/war-room-map-style";

const BB_HUB = { lon: 13.512, lat: 52.388, label: "BB Business Hub · ~800", employees: 800 };

export type GrafMapSite = {
  id: string;
  lat: number;
  lon: number;
  named?: boolean;
  name?: string | null;
};

type ViewMode = "both" | "heatmap" | "points";

type Props = {
  employers: GrafEmployeeRecord[];
  backgroundSites?: GrafMapSite[];
  className?: string;
};

function buildEmployerFeatures(employers: GrafEmployeeRecord[]): GeoJSON.Feature[] {
  return employers
    .filter((s) => s.lat != null && s.lon != null)
    .map((s) => {
      const weight = employmentWeight(s);
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.lon, s.lat] },
        properties: {
          id: s.id,
          name: s.name,
          employees: s.employees,
          weight,
          confidence: s.confidence,
          landuse: s.landuse,
          range: s.employeesRange
        }
      };
    });
}

function setLayerVisibility(m: import("maplibre-gl").Map, mode: ViewMode) {
  const heat = mode === "both" || mode === "heatmap";
  const pts = mode === "both" || mode === "points";
  for (const id of ["employment-heatmap", "employment-heat-core"]) {
    if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", heat ? "visible" : "none");
  }
  for (const id of ["employment-glow", "employment-points", "employment-stroke"]) {
    if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", pts ? "visible" : "none");
  }
}

export function GrafEmployerMap({ employers, backgroundSites = [], className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const modeRef = useRef<ViewMode>("both");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const maxWeight = useMemo(
    () => Math.max(BB_HUB.employees, ...employers.map(employmentWeight), 100),
    [employers]
  );

  useEffect(() => {
    modeRef.current = viewMode;
    const m = mapRef.current;
    if (m?.getSource("gewerbe")) setLayerVisibility(m, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || employers.length === 0) return;

    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const addLayers = (m: import("maplibre-gl").Map, ml: typeof import("maplibre-gl")) => {
      const employerById = new Map(employers.map((e) => [e.id, e]));
      const employerFeatures = buildEmployerFeatures(employers);

      // BB Hub as synthetic high-weight anchor for heatmap
      employerFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [BB_HUB.lon, BB_HUB.lat] },
        properties: {
          id: "bb-hub",
          name: BB_HUB.label,
          employees: BB_HUB.employees,
          weight: BB_HUB.employees,
          confidence: "member_cited",
          landuse: "gewerbepark",
          range: null
        }
      });

      const bgFeatures: GeoJSON.Feature[] = backgroundSites
        .filter((s) => s.lat != null && s.lon != null)
        .map((s) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.lon, s.lat] },
          properties: { id: s.id, named: s.named ? 1 : 0, weight: 1 }
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
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2, 12, 3.5],
            "circle-color": "#1e293b",
            "circle-opacity": 0.35
          }
        });
      }

      m.addSource("gewerbe", {
        type: "geojson",
        data: { type: "FeatureCollection", features: employerFeatures }
      });

      // --- Heatmap: density ∝ workforce weight ---
      m.addLayer({
        id: "employment-heatmap",
        type: "heatmap",
        source: "gewerbe",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            0,
            8,
            0.15,
            40,
            0.35,
            120,
            0.55,
            400,
            0.75,
            1000,
            0.92,
            2500,
            1
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.55, 11, 0.85, 13, 1.1],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 18, 11, 28, 13, 42],
          "heatmap-opacity": 0.72,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(15,23,42,0)",
            0.12,
            "rgba(30,58,95,0.45)",
            0.28,
            "rgba(14,116,144,0.55)",
            0.45,
            "rgba(52,211,153,0.65)",
            0.62,
            "rgba(251,191,36,0.75)",
            0.82,
            "rgba(249,115,22,0.85)",
            1,
            "rgba(239,68,68,0.92)"
          ]
        }
      });

      m.addLayer({
        id: "employment-heat-core",
        type: "heatmap",
        source: "gewerbe",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            0,
            200,
            0.5,
            800,
            0.9,
            2500,
            1
          ],
          "heatmap-intensity": 0.35,
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 8, 12, 14],
          "heatmap-opacity": 0.5,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.4,
            "rgba(251,191,36,0.5)",
            1,
            "rgba(245,158,11,0.9)"
          ]
        }
      });

      // --- Sized bubbles: radius ∝ sqrt(weight) ---
      const radiusExpr: import("maplibre-gl").ExpressionSpecification = [
        "interpolate",
        ["linear"],
        ["zoom"],
        9,
        [
          "interpolate",
          ["linear"],
          ["sqrt", ["get", "weight"]],
          0,
          3,
          4,
          5,
          8,
          7,
          15,
          10,
          30,
          14,
          50,
          18
        ],
        12,
        [
          "interpolate",
          ["linear"],
          ["sqrt", ["get", "weight"]],
          0,
          4,
          4,
          7,
          8,
          10,
          15,
          14,
          30,
          20,
          50,
          26
        ]
      ];

      m.addLayer({
        id: "employment-glow",
        type: "circle",
        source: "gewerbe",
        paint: {
          "circle-radius": ["*", radiusExpr, 1.55],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            "#64748b",
            30,
            "#22d3ee",
            120,
            "#34d399",
            400,
            "#fbbf24",
            1000,
            "#f97316",
            2500,
            "#ef4444"
          ],
          "circle-opacity": 0.22,
          "circle-blur": 0.85
        }
      });

      m.addLayer({
        id: "employment-stroke",
        type: "circle",
        source: "gewerbe",
        paint: {
          "circle-radius": radiusExpr,
          "circle-color": "transparent",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "confidence"], "predicted"],
            "#fcd34d",
            ["==", ["get", "confidence"], "estimate"],
            "#c4b5fd",
            ["==", ["get", "confidence"], "member_cited"],
            "#f59e0b",
            ["==", ["get", "confidence"], "registry"],
            "#6ee7b7",
            "#94a3b8"
          ],
          "circle-stroke-opacity": 0.9
        }
      });

      m.addLayer({
        id: "employment-points",
        type: "circle",
        source: "gewerbe",
        paint: {
          "circle-radius": radiusExpr,
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            "#475569",
            30,
            "#0891b2",
            120,
            "#10b981",
            400,
            "#eab308",
            1000,
            "#ea580c",
            2500,
            "#dc2626"
          ],
          "circle-opacity": 0.82,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0f172a"
        }
      });

      setLayerVisibility(m, modeRef.current);

      new ml.Marker({ color: "#f59e0b", scale: 0.9 })
        .setLngLat([BB_HUB.lon, BB_HUB.lat])
        .setPopup(
          new ml.Popup({ offset: 12 }).setHTML(
            `<strong>${BB_HUB.label}</strong><br/><span style="color:#94a3b8">~50 firms · member-cited anchor</span>`
          )
        )
        .addTo(m);

      m.fitBounds(
        [
          [13.42, 52.32],
          [13.62, 52.42]
        ],
        { padding: 48, maxZoom: 11.4, duration: 0 }
      );

      const onPointClick = (e: import("maplibre-gl").MapMouseEvent & { features?: import("maplibre-gl").MapGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as {
          id?: string;
          name: string;
          employees?: number;
          weight?: number;
          landuse?: string;
          confidence?: string;
          range?: string;
        };
        if (p.id === "bb-hub") return;
        const rec = p.id ? employerById.get(p.id) : undefined;
        const emp =
          p.employees != null
            ? `~${Number(p.employees).toLocaleString()}${p.confidence === "predicted" ? " †" : ""}`
            : p.range
              ? `band ${p.range}`
              : p.weight
                ? `~${Number(p.weight).toLocaleString()} (planning weight)`
                : "—";
        const method = rec?.prediction?.prior
          ? `<br/><span style="color:#94a3b8;font-size:11px">Prior: ${rec.prediction.prior}</span>`
          : "";
        new ml.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${p.name}</strong><br/><span style="color:#94a3b8">${p.landuse ?? ""}</span><br/>Workforce: ${emp}${method}`
          )
          .addTo(m);
      };

      m.on("click", "employment-points", onPointClick);
      m.on("click", "employment-stroke", onPointClick);
      m.on("mouseenter", "employment-points", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "employment-points", () => {
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
        className={`h-[min(480px,58vh)] min-h-[300px] w-full rounded-xl bg-ink-900 ${className}`}
        role="img"
        aria-label="Employer workforce density map near Schönefeld"
      />

      {status === "ready" ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2">
          <div className="pointer-events-auto flex gap-1 rounded-lg border border-white/10 bg-ink-900/90 p-1 text-[10px] backdrop-blur-md">
            {(
              [
                ["both", "Heat + dots"],
                ["heatmap", "Heatmap"],
                ["points", "Dots"]
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2 py-1 font-medium transition ${
                  viewMode === mode ? "bg-sky-500/25 text-sky-100" : "text-white/55 hover:bg-white/8"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-white/10 bg-ink-900/90 px-2.5 py-2 text-[10px] text-white/55 backdrop-blur-md">
            <div className="font-semibold text-white/75">Bubble size & heat ∝ workforce</div>
            <div className="mt-1.5 flex h-2 w-36 overflow-hidden rounded-full">
              <span className="flex-1 bg-slate-600" />
              <span className="flex-1 bg-cyan-600" />
              <span className="flex-1 bg-emerald-500" />
              <span className="flex-1 bg-amber-400" />
              <span className="flex-1 bg-orange-500" />
              <span className="flex-1 bg-red-500" />
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-white/40">
              <span>~5</span>
              <span>~120</span>
              <span>~800+</span>
            </div>
            <div className="mt-1.5 text-white/40">max ref. ~{maxWeight.toLocaleString()} · † predicted · band = range mid</div>
          </div>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-ink-900/80 text-sm text-white/50">
          Loading map…
        </div>
      ) : null}
      {status === "error" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-amber-200/80">
          Map tiles blocked — workforce layers may still render on retry
        </div>
      ) : null}
    </div>
  );
}
