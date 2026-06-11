"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Popup } from "maplibre-gl";
import corridor from "@/data/ber-corridor.json";
import { useCctv } from "@/context/CctvContext";
import { useMapActions } from "@/context/MapActionsContext";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { getMitgliedById, mitgliederToGeoJSON, type MemberCategory } from "@/data/mitglieder";
import type { CctvMapProperties } from "@/lib/cctv-geojson";
import { getBerLandSiteById } from "@/data/ber-land-sites";
import {
  findOsmIntelFeatureForPopup,
  findOsmIntelFeatureFromMapSource
} from "@/lib/osm-intel-lookup";
import { osmTrace, osmTraceMapSnapshot, osmTraceSkip, osmTraceWarn } from "@/lib/osm-map-trace";
import {
  bindWarRoomMapClicks,
  setLandAnchorSelected,
  setMemberZoneHighlight,
  clearOsmVisibilityCache,
  setOsmIntelLayersVisible,
  setBerChromeVisible,
  setCctvLayersVisible,
  setupWarRoomOverlays,
  syncOsmIntelOnMap,
  updateCctvGeo,
  warRoomOverlaysReady,
  whenMapReady
} from "@/lib/map-overlays";
import {
  bindBenchmarkMapClicks,
  benchmarkStakeholdersToGeoJSON,
  raiseBenchmarkLayersToTop,
  resetBenchmarkMapClicks,
  setBenchmarkLayersVisible,
  setBenchmarkStakeholdersVisible,
  setupBenchmarkOverlays,
  syncBenchmarkGeo,
  syncBenchmarkStakeholders
} from "@/lib/benchmark-overlays";
import { benchmarkPopupHtml, singleBenchmarkGeoJSON } from "@/lib/benchmark-geo";
import { getBenchmarkById } from "@/data/benchmarks";
import { getMapRegion, type MapRegionId } from "@/lib/map-regions";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";
import { CARTO_DARK_FALLBACK_STYLE } from "@/lib/war-room-map-style";

type Props = {
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  selectedBenchmarkId?: string | null;
  onSelectBenchmark?: (id: string | null) => void;
  regionId?: MapRegionId;
  osmPayloadOverride?: OsmIntelPayload | null;
  showCctv?: boolean;
  registerMapActions?: boolean;
  osmOverlayVisible?: boolean;
  filterCategory: MemberCategory | "all";
  className?: string;
  /** Side-by-side split pane — do not use absolute full-viewport positioning */
  embedded?: boolean;
  interactionLocked?: boolean;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function WarRoomMap({
  selectedMemberId,
  onSelectMember,
  selectedBenchmarkId = null,
  onSelectBenchmark,
  regionId = "ber-corridor",
  osmPayloadOverride,
  showCctv = false,
  registerMapActions = true,
  osmOverlayVisible = true,
  filterCategory,
  className,
  embedded = false,
  interactionLocked = false
}: Props) {
  const { data: cctvData, selectedCameraId, selectCamera } = useCctv();
  const { registerFly } = useMapActions();
  const {
    data: contextOsmData,
    visibleCategories,
    berTargetsOnly,
    selectedFeatureId,
    selectedOsmAnchor,
    selectFeature
  } = useOsmIntel();
  const osmData = osmPayloadOverride ?? contextOsmData;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const cctvPopupRef = useRef<Popup | null>(null);
  const osmPopupRef = useRef<Popup | null>(null);
  const benchmarkPopupRef = useRef<Popup | null>(null);
  const regionIdRef = useRef(regionId);
  const osmOverlayVisibleRef = useRef(osmOverlayVisible);
  const lastOsmFeatureStateIdRef = useRef<string | number | null>(null);
  regionIdRef.current = regionId;
  osmOverlayVisibleRef.current = osmOverlayVisible;
  const onSelectRef = useRef(onSelectMember);
  const onSelectBenchmarkRef = useRef(onSelectBenchmark);
  const onSelectCctvRef = useRef(selectCamera);
  const onSelectOsmRef = useRef(selectFeature);
  onSelectRef.current = onSelectMember;
  onSelectBenchmarkRef.current = onSelectBenchmark;
  onSelectCctvRef.current = selectCamera;
  onSelectOsmRef.current = selectFeature;

  const corridorGeo = useMemo(() => corridor as GeoJSON.FeatureCollection, []);
  const membersGeo = useMemo(() => {
    const all = mitgliederToGeoJSON();
    if (filterCategory === "all") return all;
    return {
      ...all,
      features: all.features.filter((f) => f.properties?.category === filterCategory)
    };
  }, [filterCategory]);

  const cctvGeo = cctvData?.geojson ?? null;
  const osmGeo = osmData?.geojson ?? null;
  const osmIconGeo = osmData?.iconGeojson ?? null;
  const osmSyncRef = useRef({
    osmGeo,
    osmIconGeo,
    visibleCategories,
    berTargetsOnly
  });
  osmSyncRef.current = {
    osmGeo,
    osmIconGeo,
    visibleCategories,
    berTargetsOnly
  };

  const corridorGeoRef = useRef(corridorGeo);
  const membersGeoRef = useRef(membersGeo);
  corridorGeoRef.current = corridorGeo;
  membersGeoRef.current = membersGeo;
  const syncIdleRef = useRef<number | null>(null);
  const syncReasonRef = useRef("");
  const lastFramedRegionRef = useRef<MapRegionId | null>(null);

  const applyRegionConstraints = (map: MapLibreMap) => {
    const region = getMapRegion(regionIdRef.current);
    map.setMaxBounds(region.maxBounds);
    map.setMinZoom(region.minZoom);
    map.setMaxZoom(region.maxZoom);
  };

  const frameRegionView = (map: MapLibreMap, animate = true) => {
    const region = getMapRegion(regionIdRef.current);
    const pitch = region.isBerCorridor ? 48 : 42;
    const bearing = region.isBerCorridor ? -20 : -12;

    if (region.fitBounds) {
      const fitOpts = {
        padding: region.isBerCorridor
          ? { top: 72, bottom: 220, left: 52, right: 52 }
          : { top: 56, bottom: 160, left: 36, right: 36 },
        pitch,
        bearing,
        maxZoom: region.zoom
      };
      if (animate) map.fitBounds(region.fitBounds, { ...fitOpts, duration: 1100, essential: true });
      else map.fitBounds(region.fitBounds, { ...fitOpts, duration: 0 });
      return;
    }

    const camera = { center: region.center, zoom: region.zoom, pitch, bearing };
    if (animate) map.flyTo({ ...camera, duration: 1100, essential: true });
    else map.jumpTo(camera);
  };

  const syncBenchmarkLayersForRegion = (map: MapLibreMap) => {
    const rid = regionIdRef.current;
    const siteId = rid === "ber-corridor" ? null : rid;
    syncBenchmarkLayers(map, siteId);
    setBerChromeVisible(map, rid === "ber-corridor" || rid === "ber-osm-prototype");
    setCctvLayersVisible(map, showCctv);
  };

  const syncBenchmarkLayers = (map: MapLibreMap, siteId: string | null) => {
    setupBenchmarkOverlays(map);
    if (siteId && siteId !== "ber-corridor" && siteId !== "ber-osm-prototype") {
      const pts = map.getSource("benchmark-points") as GeoJSONSource | undefined;
      pts?.setData(singleBenchmarkGeoJSON(siteId));
      const ln = map.getSource("benchmark-lines") as GeoJSONSource | undefined;
      ln?.setData({ type: "FeatureCollection", features: [] });
      const b = getBenchmarkById(siteId);
      syncBenchmarkStakeholders(map, b ? benchmarkStakeholdersToGeoJSON(b) : { type: "FeatureCollection", features: [] });
      setBenchmarkLayersVisible(map, true);
      setBenchmarkStakeholdersVisible(map, true);
    } else {
      syncBenchmarkGeo(map);
      syncBenchmarkStakeholders(map, { type: "FeatureCollection", features: [] });
      setBenchmarkLayersVisible(map, false);
      setBenchmarkStakeholdersVisible(map, false);
    }
    bindBenchmarkMapClicks(map, (id) => onSelectBenchmarkRef.current?.(id));
  };

  const whenMapCanSync = (map: MapLibreMap, fn: () => void) => {
    return whenMapReady(map, () => {
      ensureOverlays(map);
      fn();
    });
  };

  const ensureOverlays = (map: MapLibreMap) => {
    if (warRoomOverlaysReady(map)) {
      syncBenchmarkLayersForRegion(map);
      return;
    }
    osmTrace("WarRoomMap", "ensureOverlays — creating/repairing layers");
    setupWarRoomOverlays(map, corridorGeoRef.current, membersGeoRef.current);
    bindWarRoomMapClicks(map, {
      onSelectMember: (id) => onSelectRef.current(id),
      onSelectCctv: (id) => onSelectCctvRef.current(id),
      onSelectOsm: (id, anchor) => onSelectOsmRef.current(id, anchor)
    });
    syncBenchmarkLayersForRegion(map);
    setBerChromeVisible(map, regionIdRef.current === "ber-corridor");
    setCctvLayersVisible(map, showCctv);
  };

  const runOsmSync = (reason: string) => {
    const map = mapRef.current;
    const sync = osmSyncRef.current;
    if (!map) {
      osmTraceSkip("WarRoomMap.sync", reason, { detail: "no map ref" });
      return;
    }
    if (!sync.osmGeo) {
      osmTraceSkip("WarRoomMap.sync", reason, { detail: "osmGeo null" });
      return;
    }
    if (!warRoomOverlaysReady(map)) {
      osmTraceSkip("WarRoomMap.sync", reason, {
        detail: "overlays not ready (corridor or OSM fill missing)",
        hasCorridor: Boolean(map.getSource("ber-corridor")),
        hasOsmFill: Boolean(map.getLayer("osm-intel-industry-fill")),
        styleLoaded: map.isStyleLoaded(),
        loaded: map.loaded()
      });
      whenMapReady(map, () => {
        ensureOverlays(mapRef.current!);
        runOsmSync(reason);
      });
      return;
    }
    osmTrace("WarRoomMap.sync", reason, {
      features: sync.osmGeo.features.length,
      icons: sync.osmIconGeo?.features.length ?? null,
      berTargetsOnly: sync.berTargetsOnly
    });
    if (osmOverlayVisibleRef.current) {
      clearOsmVisibilityCache(map);
    }
    syncOsmIntelOnMap(
      map,
      sync.osmGeo,
      sync.visibleCategories,
      sync.berTargetsOnly,
      sync.osmIconGeo ?? undefined
    );
    if (!osmOverlayVisibleRef.current) {
      setOsmIntelLayersVisible(map, false);
    }
    raiseBenchmarkLayersToTop(map);
  };

  const syncOsmToMap = (reason: string) => {
    syncReasonRef.current = reason;
    if (syncIdleRef.current != null) {
      if (typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(syncIdleRef.current);
      } else {
        clearTimeout(syncIdleRef.current);
      }
    }
    const run = () => {
      syncIdleRef.current = null;
      runOsmSync(syncReasonRef.current);
    };
    if (typeof requestIdleCallback !== "undefined") {
      syncIdleRef.current = requestIdleCallback(run, { timeout: 350 });
    } else {
      syncIdleRef.current = window.setTimeout(run, 16);
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let onResize: (() => void) | null = null;
    let fallbackStage = 0;

    const finishMapSetup = (map: MapLibreMap, reason: string) => {
      if (cancelled || mapRef.current !== map) return;
      ensureOverlays(map);
      applyRegionConstraints(map);
      if (lastFramedRegionRef.current !== regionIdRef.current) {
        lastFramedRegionRef.current = regionIdRef.current;
        frameRegionView(map, false);
      }
      setMemberZoneHighlight(map, null);
      setBerChromeVisible(map, regionIdRef.current === "ber-corridor");
      setCctvLayersVisible(map, showCctv);
      syncOsmToMap(reason);
      if (embedded) requestAnimationFrame(() => map.resize());
    };

    const whenStyleReady = (map: MapLibreMap, reason: string) => {
      if (map.isStyleLoaded()) {
        finishMapSetup(map, reason);
        return;
      }
      osmTrace("WarRoomMap", `defer ${reason} until idle (style not loaded)`);
      map.once("idle", () => finishMapSetup(map, reason));
    };

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;

      const initialRegion = getMapRegion(regionIdRef.current);
      const map = new maplibre.Map({
        container: containerRef.current!,
        // Raster basemap — GL style was erroring on load and wiping overlays via setStyle
        style: CARTO_DARK_FALLBACK_STYLE,
        center: initialRegion.center,
        zoom: initialRegion.zoom,
        pitch: initialRegion.isBerCorridor ? 48 : 42,
        bearing: initialRegion.isBerCorridor ? -20 : -12,
        attributionControl: { compact: true }
      });

      mapRef.current = map;

      map.on("error", (ev) => {
        if (fallbackStage >= 1) return;
        osmTraceWarn("WarRoomMap", "map error — fallback to OSM raster tiles", {
          error: "error" in ev ? String(ev.error) : "unknown"
        });
        fallbackStage = 1;
        resetBenchmarkMapClicks(map);
        map.setStyle(CARTO_DARK_FALLBACK_STYLE);
      });

      onResize = () => map.resize();
      window.addEventListener("resize", onResize);

      map.once("load", () => {
        osmTrace("WarRoomMap", "map load");
        map.resize();
        (window as Window & { __berMap?: MapLibreMap }).__berMap = map;
        if (registerMapActions) {
          registerFly((center, zoom = 12.5) => {
            map.flyTo({
              center,
              zoom,
              pitch: 48,
              bearing: -15,
              duration: 1400,
              essential: true
            });
          });
        }
        whenStyleReady(map, "map.load");
      });

      map.on("style.load", () => {
        resetBenchmarkMapClicks(map);
        osmTrace("WarRoomMap", "style.load", {
          styleLoaded: map.isStyleLoaded(),
          ready: warRoomOverlaysReady(map)
        });
        whenStyleReady(map, "style.load");
      });
    })();

    return () => {
      cancelled = true;
      if (syncIdleRef.current != null) {
        if (typeof cancelIdleCallback !== "undefined") {
          cancelIdleCallback(syncIdleRef.current);
        } else {
          clearTimeout(syncIdleRef.current);
        }
        syncIdleRef.current = null;
      }
      if (onResize) window.removeEventListener("resize", onResize);
      popupRef.current?.remove();
      cctvPopupRef.current?.remove();
      osmPopupRef.current?.remove();
      benchmarkPopupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once
  }, [corridorGeo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource("ber-members") as import("maplibre-gl").GeoJSONSource | undefined;
    src?.setData(membersGeo);
  }, [membersGeo]);

  useEffect(() => {
    if (!showCctv) return;
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !cctvGeo) return;
    updateCctvGeo(map, cctvGeo as GeoJSON.FeatureCollection<GeoJSON.Point, CctvMapProperties>);
  }, [cctvGeo, showCctv]);

  useEffect(() => {
    if (!osmGeo) {
      osmTraceSkip("WarRoomMap.effect", "osm data effect", { detail: "osmGeo null" });
      return;
    }
    const map = mapRef.current;
    if (!map) {
      osmTraceSkip("WarRoomMap.effect", "osm data effect", { detail: "map ref null" });
      return;
    }

    osmTrace("WarRoomMap.effect", "osm deps changed", {
      features: osmGeo.features.length,
      icons: osmIconGeo?.features.length ?? null,
      ready: warRoomOverlaysReady(map)
    });

    let cancelled = false;
    const run = () => {
      if (cancelled || mapRef.current !== map) return;
      ensureOverlays(map);
      syncOsmToMap("osm effect");
    };

    if (map.isStyleLoaded()) {
      run();
      return () => {
        cancelled = true;
      };
    }

    osmTrace("WarRoomMap.effect", "defer until idle (style not loaded)");
    map.once("idle", run);
    return () => {
      cancelled = true;
      map.off("idle", run);
    };
  }, [osmGeo, osmIconGeo, visibleCategories, berTargetsOnly, osmOverlayVisible, osmPayloadOverride]);

  useEffect(() => {
    regionIdRef.current = regionId;
    const map = mapRef.current;
    if (!map) return;
    const cleanup = whenMapCanSync(map, () => {
      applyRegionConstraints(map);
      if (lastFramedRegionRef.current !== regionId) {
        lastFramedRegionRef.current = regionId;
        frameRegionView(map, true);
      }
      syncBenchmarkLayersForRegion(map);
      clearOsmVisibilityCache(map);
      syncOsmToMap("region change");
    });
    return cleanup;
  }, [regionId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    (async () => {
      const maplibre = await import("maplibre-gl");

      const features = map.querySourceFeatures("ber-members");
      for (const f of features) {
        if (f.id != null) {
          map.setFeatureState({ source: "ber-members", id: f.id }, { selected: false });
        }
      }
      setMemberZoneHighlight(map, selectedMemberId);

      popupRef.current?.remove();
      popupRef.current = null;

      if (!selectedMemberId) return;

      const member = getMitgliedById(selectedMemberId);
      if (!member) return;

      const target = features.find((f) => f.properties?.id === selectedMemberId);
      if (target?.id != null) {
        map.setFeatureState({ source: "ber-members", id: target.id }, { selected: true });
      }

      map.flyTo({
        center: member.coordinates,
        zoom: 12.4,
        pitch: 50,
        duration: 1200,
        essential: true
      });

      const html = `
        <div style="font-family: ui-sans-serif, system-ui; font-size: 12px; line-height: 1.35; color: #0b1020;">
          <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(member.shortName)}</div>
          <div style="opacity: 0.85; font-size: 11px;">${escapeHtml(member.corridorRole)}</div>
          <a href="${escapeHtml(member.website)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:11px;color:#0369a1;">Website ↗</a>
        </div>
      `;

      popupRef.current = new maplibre.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
        className: "ber-member-popup"
      })
        .setLngLat(member.coordinates)
        .setHTML(html)
        .addTo(map);

      popupRef.current.on("close", () => onSelectRef.current(null));
    })();
  }, [selectedMemberId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBenchmarkId) return;
    if (regionId !== selectedBenchmarkId && regionId !== "ber-corridor") return;

    const b = getBenchmarkById(selectedBenchmarkId);
    if (!b) return;

    let cancelled = false;
    const cleanup = whenMapCanSync(map, () => {
      void (async () => {
        if (cancelled) return;
        const maplibre = await import("maplibre-gl");
        benchmarkPopupRef.current?.remove();
        benchmarkPopupRef.current = new maplibre.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "280px",
          className: "ber-map-popup"
        })
          .setLngLat(b.coordinates)
          .setHTML(benchmarkPopupHtml(selectedBenchmarkId))
          .addTo(map);

        benchmarkPopupRef.current.on("close", () => {
          benchmarkPopupRef.current = null;
        });
      })();
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [selectedBenchmarkId, regionId]);

  useEffect(() => {
    if (!showCctv) return;
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    (async () => {
      const maplibre = await import("maplibre-gl");

      const cctvFeatures = map.querySourceFeatures("ber-cctv");
      for (const f of cctvFeatures) {
        if (f.id != null && !f.properties?.cluster_id) {
          map.setFeatureState({ source: "ber-cctv", id: f.id }, { selected: false });
        }
      }

      cctvPopupRef.current?.remove();
      cctvPopupRef.current = null;

      if (!selectedCameraId || !cctvGeo) return;

      const feature = cctvGeo.features.find((f) => f.properties?.id === selectedCameraId);
      if (!feature?.geometry || feature.geometry.type !== "Point") return;

      const props = feature.properties as CctvMapProperties;
      const coords = feature.geometry.coordinates as [number, number];

      if (feature.id != null) {
        map.setFeatureState({ source: "ber-cctv", id: feature.id }, { selected: true });
      }

      map.flyTo({
        center: coords,
        zoom: Math.max(map.getZoom(), 13),
        pitch: 45,
        duration: 900,
        essential: true
      });

      const html = `
        <div style="font-family: ui-sans-serif, system-ui; font-size: 12px; line-height: 1.35; color: #0b1020;">
          <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(props.name)}</div>
          <div style="opacity: 0.85; font-size: 11px;">${escapeHtml(props.category)} · ${props.source}</div>
          ${props.city ? `<div style="font-size: 11px; opacity: 0.75;">${escapeHtml(props.city)}</div>` : ""}
          <div style="font-size: 10px; margin-top: 6px; opacity: 0.65;">${props.distanceKm} km from Schönefeld</div>
        </div>
      `;

      cctvPopupRef.current = new maplibre.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "280px",
        className: "ber-member-popup"
      })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);

      cctvPopupRef.current.on("close", () => onSelectCctvRef.current(null));
    })();
  }, [selectedCameraId, cctvGeo, showCctv]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    setCctvLayersVisible(map, showCctv);
  }, [showCctv]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      if (!map.isStyleLoaded() || !map.loaded()) return;

      const maplibre = await import("maplibre-gl");

      const clearOsmSelection = () => {
        const prev = lastOsmFeatureStateIdRef.current;
        if (prev != null && map.getSource("ber-osm-intel")) {
          try {
            map.setFeatureState({ source: "ber-osm-intel", id: prev }, { selected: false });
          } catch {
            /* feature may have been removed from source */
          }
        }
        lastOsmFeatureStateIdRef.current = null;
      };

      osmPopupRef.current?.remove();
      osmPopupRef.current = null;

      if (!selectedFeatureId || !osmGeo) {
        clearOsmSelection();
        setLandAnchorSelected(map, null);
        return;
      }

      if (!map.getSource("ber-osm-intel")) {
        osmTraceSkip("WarRoomMap.popup", "ber-osm-intel source missing", { selectedFeatureId });
        return;
      }

      clearOsmSelection();

      if (selectedFeatureId.startsWith("curated/")) {
        const siteId = selectedFeatureId.slice("curated/".length);
        const site = getBerLandSiteById(siteId);
        setLandAnchorSelected(map, siteId);
        if (!site) return;

        const coords = selectedOsmAnchor ?? site.coordinates;
        map.flyTo({
          center: coords,
          zoom: Math.max(map.getZoom(), 13.5),
          pitch: 48,
          duration: 900,
          essential: true
        });

        const html = `
          <div style="font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.4; color: #1a0505;">
            <div style="font-weight: 700; color: #047857; margin-bottom: 4px;">BER+ Land · ${escapeHtml(site.name)}</div>
            <div>${site.areaHa} ha · ${escapeHtml(site.status)}</div>
            <div style="margin-top: 4px; color: #065f46;">${escapeHtml(site.useCase)}</div>
            <div style="margin-top: 4px; opacity: 0.85;">${escapeHtml(site.berPlusRole)}</div>
            <div style="margin-top: 4px; font-size: 10px; opacity: 0.7;">${escapeHtml(site.notes)}</div>
          </div>
        `;

        osmPopupRef.current = new maplibre.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "300px",
          className: "ber-osm-popup"
        })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);

        osmPopupRef.current.on("close", () => onSelectOsmRef.current(null));
        return;
      }

      setLandAnchorSelected(map, null);

      const picked =
        findOsmIntelFeatureForPopup(osmGeo, osmIconGeo, selectedFeatureId, selectedOsmAnchor) ??
        findOsmIntelFeatureFromMapSource(map, selectedFeatureId, selectedOsmAnchor);
      if (!picked) {
        osmTraceWarn("WarRoomMap.popup", "lookup failed", {
          selectedFeatureId,
          anchor: selectedOsmAnchor,
          geoCount: osmGeo.features.length
        });
        return;
      }

      osmTrace("WarRoomMap.popup", "show", {
        id: selectedFeatureId,
        name: picked.props.name,
        category: picked.props.category
      });

      const { props, coordinates: coords } = picked;

      const stateId = picked.feature.id ?? selectedFeatureId;
      map.setFeatureState({ source: "ber-osm-intel", id: stateId }, { selected: true });
      lastOsmFeatureStateIdRef.current = stateId;

      map.flyTo({
        center: coords,
        zoom: Math.max(map.getZoom(), 13.5),
        pitch: 48,
        duration: 900,
        essential: true
      });

      const landExtra =
        props.areaHa != null
          ? `<div style="margin-top: 4px; color: #047857;">${props.areaHa} ha · ${escapeHtml(props.landOpportunity ?? "")} · suit ${props.landSuitability ?? "—"}</div>`
          : "";
      const landNote = props.landNotes
        ? `<div style="margin-top: 4px; font-size: 10px; opacity: 0.75;">${escapeHtml(props.landNotes)}</div>`
        : "";

      const html = `
        <div style="font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.4; color: #1a0505;">
          <div style="font-weight: 700; color: #991b1b; margin-bottom: 4px;">OSM Intel · ${escapeHtml(props.name)}</div>
          <div>${escapeHtml(props.category)} / ${escapeHtml(props.subcategory)}</div>
          <div style="margin-top: 4px; opacity: 0.8;">${escapeHtml(props.tagsSummary)}</div>
          ${landExtra}
          ${landNote}
          ${props.berRelevant ? `<div style="margin-top: 6px; color: #b91c1c; font-weight: 600;">BER+ ★${props.berScore}</div>` : ""}
          ${
            props.memberLinked
              ? `<div style="margin-top: 6px; color: #b45309; font-weight: 600;">Mitglieder · ${escapeHtml(props.memberLabels)}</div>`
              : ""
          }
          <div style="margin-top: 4px; font-size: 10px; opacity: 0.65;">${props.osmType}/${props.osmId}</div>
        </div>
      `;

      osmPopupRef.current = new maplibre.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
        className: "ber-osm-popup"
      })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);

      osmPopupRef.current.on("close", () => onSelectOsmRef.current(null));
    };

    const cleanup = whenMapReady(map, () => {
      void run();
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [selectedFeatureId, selectedOsmAnchor, osmGeo, osmIconGeo]);

  useEffect(() => {
    if (!embedded || !containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [embedded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const controls = [map.dragPan, map.scrollZoom, map.touchZoomRotate, map.doubleClickZoom, map.boxZoom];
    if (interactionLocked) {
      for (const c of controls) c.disable();
    } else {
      for (const c of controls) c.enable();
    }
  }, [interactionLocked]);

  return (
    <div
      ref={containerRef}
      data-testid={embedded ? "showcase-map-embedded" : "showcase-map"}
      className={
        embedded
          ? "absolute inset-0"
          : `absolute inset-0 h-full w-full ${className ?? ""}`
      }
    />
  );
}
