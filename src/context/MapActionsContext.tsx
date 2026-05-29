"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode
} from "react";
import { getBerLandSiteById } from "@/data/ber-land-sites";
import { getMitgliedById } from "@/data/mitglieder";

type FlyFn = (center: [number, number], zoom?: number) => void;

type MapActionsContextValue = {
  flyTo: FlyFn;
  focusLandSite: (siteId: string) => void;
  focusMember: (memberId: string) => void;
  registerFly: (fn: FlyFn) => void;
  mapReady: boolean;
};

const MapActionsContext = createContext<MapActionsContextValue | null>(null);

export function MapActionsProvider({ children }: { children: ReactNode }) {
  const flyRef = useRef<FlyFn | null>(null);
  const mapReadyRef = useRef(false);

  const registerFly = useCallback((fn: FlyFn) => {
    flyRef.current = fn;
    mapReadyRef.current = true;
  }, []);

  const flyTo = useCallback<FlyFn>((center, zoom = 12.5) => {
    flyRef.current?.(center, zoom);
  }, []);

  const value = useMemo<MapActionsContextValue>(
    () => ({
      flyTo,
      focusLandSite: (siteId) => {
        const site = getBerLandSiteById(siteId);
        if (site) flyTo(site.coordinates, 13.2);
      },
      focusMember: (memberId) => {
        const member = getMitgliedById(memberId);
        if (member) flyTo(member.coordinates, 12.6);
      },
      registerFly,
      get mapReady() {
        return mapReadyRef.current;
      }
    }),
    [flyTo, registerFly]
  );

  return <MapActionsContext.Provider value={value}>{children}</MapActionsContext.Provider>;
}

export function useMapActions() {
  const ctx = useContext(MapActionsContext);
  if (!ctx) throw new Error("useMapActions must be used within MapActionsProvider");
  return ctx;
}
