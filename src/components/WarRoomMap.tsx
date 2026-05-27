"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as MapLibreMap, Popup } from "maplibre-gl";
import corridor from "@/data/ber-corridor.json";
import { useCctv } from "@/context/CctvContext";
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
  setupWarRoomOverlays,
  syncOsmIntelOnMap,
  updateCctvGeo,
  warRoomOverlaysReady
} from "@/lib/map-overlays";
import { CARTO_DARK_STYLE, OSM_STANDARD_STYLE } from "@/lib/war-room-map-style";

type Props = {
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  filterCategory: MemberCategory | "all";
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function WarRoomMap({ selectedMemberId, onSelectMember, filterCategory }: Props) {
  const { data: cctvData, selectedCameraId, selectCamera } = useCctv();
  const {
    data: osmData,
    visibleCategories,
    berTargetsOnly,
    selectedFeatureId,
    selectedOsmAnchor,
    selectFeature
  } = useOsmIntel();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const cctvPopupRef = useRef<Popup | null>(null);
  const osmPopupRef = useRef<Popup | null>(null);
  const onSelectRef = useRef(onSelectMember);
  const onSelectCctvRef = useRef(selectCamera);
  const onSelectOsmRef = useRef(selectFeature);
  onSelectRef.current = onSelectMember;
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

  const ensureOverlays = (map: MapLibreMap) => {
    if (warRoomOverlaysReady(map)) return;
    osmTrace("WarRoomMap", "ensureOverlays — creating/repairing layers");
    setupWarRoomOverlays(map, corridorGeoRef.current, membersGeoRef.current);
    bindWarRoomMapClicks(map, {
      onSelectMember: (id) => onSelectRef.current(id),
      onSelectCctv: (id) => onSelectCctvRef.current(id),
      onSelectOsm: (id, anchor) => onSelectOsmRef.current(id, anchor)
    });
  };

  const syncOsmToMap = (reason: string) => {
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
      return;
    }
    osmTrace("WarRoomMap.sync", reason, {
      features: sync.osmGeo.features.length,
      icons: sync.osmIconGeo?.features.length ?? null,
      berTargetsOnly: sync.berTargetsOnly
    });
    syncOsmIntelOnMap(
      map,
      sync.osmGeo,
      sync.visibleCategories,
      sync.berTargetsOnly,
      sync.osmIconGeo ?? undefined
    );
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let onResize: (() => void) | null = null;
    let fallbackStage = 0;

    const finishMapSetup = (map: MapLibreMap, reason: string) => {
      if (cancelled || mapRef.current !== map) return;
      ensureOverlays(map);
      setMemberZoneHighlight(map, null);
      syncOsmToMap(reason);
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

      const map = new maplibre.Map({
        container: containerRef.current!,
        // Raster basemap — GL style was erroring on load and wiping overlays via setStyle
        style: CARTO_DARK_STYLE,
        center: [13.5, 52.362],
        zoom: 10.4,
        pitch: 48,
        bearing: -20,
        attributionControl: { compact: true }
      });

      mapRef.current = map;

      map.on("error", (ev) => {
        if (fallbackStage >= 1) return;
        osmTraceWarn("WarRoomMap", "map error — fallback to OSM raster tiles", {
          error: "error" in ev ? String(ev.error) : "unknown"
        });
        fallbackStage = 1;
        map.setStyle(OSM_STANDARD_STYLE);
      });

      onResize = () => map.resize();
      window.addEventListener("resize", onResize);

      map.once("load", () => {
        osmTrace("WarRoomMap", "map load");
        map.resize();
        whenStyleReady(map, "map.load");
      });

      map.on("style.load", () => {
        osmTrace("WarRoomMap", "style.load", {
          styleLoaded: map.isStyleLoaded(),
          ready: warRoomOverlaysReady(map)
        });
        whenStyleReady(map, "style.load");
      });
    })();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      popupRef.current?.remove();
      cctvPopupRef.current?.remove();
      osmPopupRef.current?.remove();
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
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !cctvGeo) return;
    updateCctvGeo(map, cctvGeo as GeoJSON.FeatureCollection<GeoJSON.Point, CctvMapProperties>);
  }, [cctvGeo]);

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
  }, [osmGeo, osmIconGeo, visibleCategories, berTargetsOnly]);

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
  }, [selectedCameraId, cctvGeo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      if (!map.isStyleLoaded()) {
        osmTraceSkip("WarRoomMap.popup", "style not loaded yet");
        return;
      }

      const maplibre = await import("maplibre-gl");

      if (map.getSource("ber-osm-intel")) {
        const features = map.querySourceFeatures("ber-osm-intel");
        for (const f of features) {
          const fid = f.properties?.id ?? f.id;
          if (fid != null) {
            map.setFeatureState({ source: "ber-osm-intel", id: fid }, { selected: false });
          }
        }
      }

      osmPopupRef.current?.remove();
      osmPopupRef.current = null;

      if (!selectedFeatureId || !osmGeo) {
        setLandAnchorSelected(map, null);
        return;
      }

      if (!map.getSource("ber-osm-intel")) {
        osmTraceSkip("WarRoomMap.popup", "ber-osm-intel source missing", { selectedFeatureId });
        return;
      }

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

    void run();
    if (!map.isStyleLoaded() || !map.getSource("ber-osm-intel")) {
      const onReady = () => {
        void run();
      };
      map.once("idle", onReady);
      map.once("style.load", onReady);
      return () => {
        cancelled = true;
        map.off("idle", onReady);
        map.off("style.load", onReady);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [selectedFeatureId, selectedOsmAnchor, osmGeo, osmIconGeo]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
