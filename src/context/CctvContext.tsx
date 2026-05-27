"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CctvAggregate } from "@/lib/cctv";

type CctvContextValue = {
  loading: boolean;
  data: CctvAggregate | null;
  selectedCameraId: string | null;
  selectCamera: (id: string | null) => void;
  reload: () => Promise<void>;
};

const CctvContext = createContext<CctvContextValue | null>(null);

export function CctvProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CctvAggregate | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cctv", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CctvAggregate;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <CctvContext.Provider
      value={{
        loading,
        data,
        selectedCameraId,
        selectCamera: setSelectedCameraId,
        reload
      }}
    >
      {children}
    </CctvContext.Provider>
  );
}

export function useCctv() {
  const ctx = useContext(CctvContext);
  if (!ctx) throw new Error("useCctv must be used within CctvProvider");
  return ctx;
}
