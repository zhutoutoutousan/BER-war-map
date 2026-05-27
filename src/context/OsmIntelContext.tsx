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
  visibleCategories: Record<OsmIntelCategory, boolean>;
  berTargetsOnly: boolean;
  selectedFeatureId: string | null;
  /** Map click anchor for popup when picking an icon marker */
  selectedOsmAnchor: [number, number] | null;
  toggleCategory: (id: OsmIntelCategory) => void;
  setBerTargetsOnly: (v: boolean) => void;
  selectFeature: (id: string | null, anchor?: [number, number] | null) => void;
  reload: () => Promise<void>;
};

const defaultVisible = Object.fromEntries(
  OSM_INTEL_CATEGORIES.map((c) => [c.id, true])
) as Record<OsmIntelCategory, boolean>;

const OsmIntelContext = createContext<OsmIntelContextValue | null>(null);

export function OsmIntelProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OsmIntelPayload | null>(null);
  const [visibleCategories, setVisibleCategories] = useState(defaultVisible);
  const [berTargetsOnly, setBerTargetsOnly] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedOsmAnchor, setSelectedOsmAnchor] = useState<[number, number] | null>(null);

  const selectFeature = useCallback((id: string | null, anchor?: [number, number] | null) => {
    osmTrace("OsmIntelContext", "selectFeature", { id, anchor: anchor ?? null });
    setSelectedFeatureId(id);
    setSelectedOsmAnchor(id ? (anchor ?? null) : null);
  }, []);

  const reload = useCallback(async () => {
    osmTrace("OsmIntelContext", "fetch start");
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    reload();
  }, [reload]);

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
        visibleCategories,
        berTargetsOnly,
        selectedFeatureId,
        selectedOsmAnchor,
        toggleCategory,
        setBerTargetsOnly,
        selectFeature,
        reload
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
