"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import { OSM_INTEL_CATEGORIES } from "@/lib/osm-intel-categories";
import { osmTrace, osmTraceWarn } from "@/lib/osm-map-trace";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";

type OsmIntelContextValue = {
  loading: boolean;
  error: string | null;
  data: OsmIntelPayload | null;
  activeRegionId: string | null;
  visibleCategories: Record<OsmIntelCategory, boolean>;
  berTargetsOnly: boolean;
  selectedFeatureId: string | null;
  selectedOsmAnchor: [number, number] | null;
  toggleCategory: (id: OsmIntelCategory) => void;
  setBerTargetsOnly: (v: boolean) => void;
  selectFeature: (id: string | null, anchor?: [number, number] | null) => void;
  reloadBerCorridor: () => Promise<void>;
  loadBenchmarkRegion: (benchmarkId: string) => Promise<void>;
};

const defaultVisible = Object.fromEntries(
  OSM_INTEL_CATEGORIES.map((c) => [c.id, true])
) as Record<OsmIntelCategory, boolean>;

const OsmIntelContext = createContext<OsmIntelContextValue | null>(null);

export function OsmIntelProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OsmIntelPayload | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [visibleCategories, setVisibleCategories] = useState(defaultVisible);
  const [berTargetsOnly, setBerTargetsOnly] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedOsmAnchor, setSelectedOsmAnchor] = useState<[number, number] | null>(null);

  const selectFeature = useCallback((id: string | null, anchor?: [number, number] | null) => {
    osmTrace("OsmIntelContext", "selectFeature", { id, anchor: anchor ?? null });
    setSelectedFeatureId(id);
    setSelectedOsmAnchor(id ? (anchor ?? null) : null);
  }, []);

  const reloadBerCorridor = useCallback(async () => {
    osmTrace("OsmIntelContext", "fetch BER corridor");
    setLoading(true);
    setError(null);
    setActiveRegionId(null);
    try {
      const res = await fetch("/api/osm/schoenefeld", { cache: "no-store" });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const payload = (await res.json()) as OsmIntelPayload;
      osmTrace("OsmIntelContext", "fetch ok", {
        features: payload.geojson.features.length,
        icons: payload.iconGeojson.features.length,
        fetchedAt: payload.fetchedAt
      });
      setData(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load OSM intelligence";
      osmTraceWarn("OsmIntelContext", "fetch failed", { error: msg });
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBenchmarkRegion = useCallback(async (benchmarkId: string) => {
    if (benchmarkId === "ber-osm-prototype") {
      setBerTargetsOnly(false);
      await reloadBerCorridor();
      return;
    }
    osmTrace("OsmIntelContext", "fetch benchmark region", { benchmarkId });
    setLoading(true);
    setError(null);
    setActiveRegionId(benchmarkId);
    setBerTargetsOnly(false);
    try {
      const res = await fetch(`/api/osm/benchmark/${benchmarkId}`, { cache: "no-store" });
      const payload = (await res.json()) as OsmIntelPayload & { fetchError?: string };
      if (!res.ok && !payload.geojson) {
        throw new Error((payload as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      if (payload.fetchError) {
        osmTraceWarn("OsmIntelContext", "benchmark osm partial", {
          benchmarkId,
          error: payload.fetchError
        });
        setError(payload.fetchError);
      }
      osmTrace("OsmIntelContext", "benchmark osm ok", {
        benchmarkId,
        features: payload.geojson.features.length
      });
      setData(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load benchmark OSM";
      osmTraceWarn("OsmIntelContext", "benchmark fetch failed", { error: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [reloadBerCorridor]);

  useEffect(() => {
    reloadBerCorridor();
  }, [reloadBerCorridor]);

  const toggleCategory = useCallback((id: OsmIntelCategory) => {
    setVisibleCategories((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      osmTrace("OsmIntelContext", "toggleCategory", { id, on: next[id] });
      return next;
    });
  }, []);

  return (
    <OsmIntelContext.Provider
      value={{
        loading,
        error,
        data,
        activeRegionId,
        visibleCategories,
        berTargetsOnly,
        selectedFeatureId,
        selectedOsmAnchor,
        toggleCategory,
        setBerTargetsOnly,
        selectFeature,
        reloadBerCorridor,
        loadBenchmarkRegion
      }}
    >
      {children}
    </OsmIntelContext.Provider>
  );
}

export function useOsmIntel() {
  const ctx = useContext(OsmIntelContext);
  if (!ctx) throw new Error("useOsmIntel must be used within OsmIntelProvider");
  return ctx;
}
