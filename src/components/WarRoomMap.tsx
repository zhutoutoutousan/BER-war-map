"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as MapLibreMap, Popup } from "maplibre-gl";
import corridor from "@/data/ber-corridor.json";
import { useCctv } from "@/context/CctvContext";
import { getMitgliedById, mitgliederToGeoJSON, type MemberCategory } from "@/data/mitglieder";
import type { CctvMapProperties } from "@/lib/cctv-geojson";
import {
  bindCctvInteractions,
  bindMapInteractions,
  setupWarRoomOverlays,
  updateCctvGeo
} from "@/lib/map-overlays";
import { CARTO_DARK_MATTER_GL, CARTO_DARK_STYLE, OSM_STANDARD_STYLE } from "@/lib/war-room-map-style";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const cctvPopupRef = useRef<Popup | null>(null);
  const onSelectRef = useRef(onSelectMember);
  const onSelectCctvRef = useRef(selectCamera);
  onSelectRef.current = onSelectMember;
  onSelectCctvRef.current = selectCamera;

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let onResize: (() => void) | null = null;
    let fallbackStage = 0;

    const initOverlays = (map: MapLibreMap) => {
      setupWarRoomOverlays(map, corridorGeo, membersGeo);
      bindMapInteractions(map, (id) => onSelectRef.current(id));
      bindCctvInteractions(map, (id) => onSelectCctvRef.current(id));
    };

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled) return;

      const map = new maplibre.Map({
        container: containerRef.current!,
        style: CARTO_DARK_MATTER_GL,
        center: [13.5, 52.362],
        zoom: 10.4,
        pitch: 48,
        bearing: -20,
        attributionControl: { compact: true }
      });

      mapRef.current = map;

      map.on("error", () => {
        if (fallbackStage === 0) {
          fallbackStage = 1;
          map.setStyle(CARTO_DARK_STYLE);
        } else if (fallbackStage === 1) {
          fallbackStage = 2;
          map.setStyle(OSM_STANDARD_STYLE);
        }
      });

      onResize = () => map.resize();
      window.addEventListener("resize", onResize);

      map.once("load", () => {
        map.resize();
        initOverlays(map);
      });

      map.on("style.load", () => {
        if (!map.getSource("ber-corridor") && map.isStyleLoaded()) {
          initOverlays(map);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      popupRef.current?.remove();
      cctvPopupRef.current?.remove();
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

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
