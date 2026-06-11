"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  buildSeedInventory,
  STORAGE_KEY,
  type CollaborativeInventoryItem,
  type InventoryLayerType,
  type InventoryItemStatus
} from "@/data/collaborative-inventory";
import { useUserSession } from "@/context/UserSessionContext";

type ProposeInput = {
  layer: InventoryLayerType;
  title: string;
  description: string;
  memberIds: string[];
  ha?: number;
  landSiteId?: string;
  phase?: string;
  counterpartSought?: string;
};

type CollaborativeInventoryContextValue = {
  items: CollaborativeInventoryItem[];
  stats: {
    total: number;
    verified: number;
    pending: number;
    byLayer: Record<InventoryLayerType, { total: number; verified: number }>;
  };
  actorLabel: string;
  canActAsMember: (memberId: string) => boolean;
  canActAsSecretariat: boolean;
  proposeItem: (input: ProposeInput) => string;
  submitForReview: (id: string) => void;
  verifyItem: (id: string) => void;
  requestUpdate: (id: string, note?: string) => void;
  resetDemo: () => void;
};

const CollaborativeInventoryContext = createContext<CollaborativeInventoryContextValue | null>(null);

function loadItems(): CollaborativeInventoryItem[] {
  if (typeof window === "undefined") return buildSeedInventory();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedInventory();
    const parsed = JSON.parse(raw) as CollaborativeInventoryItem[];
    return Array.isArray(parsed) && parsed.length ? parsed : buildSeedInventory();
  } catch {
    return buildSeedInventory();
  }
}

function saveItems(items: CollaborativeInventoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
}

function actorName(memberId: string | null, guestPersona: string | null): string {
  if (memberId) return memberId.toUpperCase();
  if (guestPersona) return `Guest · ${guestPersona}`;
  return "BER+ guest";
}

export function CollaborativeInventoryProvider({ children }: { children: ReactNode }) {
  const { memberId, guestPersona } = useUserSession();
  const [items, setItems] = useState<CollaborativeInventoryItem[]>(buildSeedInventory);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveItems(items);
  }, [items, hydrated]);

  const actorLabel = actorName(memberId, guestPersona);
  const canActAsSecretariat = true;

  const canActAsMember = useCallback(
    (targetMemberId: string) => {
      if (memberId) return memberId === targetMemberId;
      return canActAsSecretariat;
    },
    [memberId, canActAsSecretariat]
  );

  const patchItem = useCallback(
    (id: string, patch: Partial<CollaborativeInventoryItem>, action: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                history: [
                  ...item.history,
                  { at: new Date().toISOString(), actor: actorLabel, action }
                ]
              }
            : item
        )
      );
    },
    [actorLabel]
  );

  const proposeItem = useCallback(
    (input: ProposeInput) => {
      const id = `inv-user-${Date.now()}`;
      const item: CollaborativeInventoryItem = {
        id,
        layer: input.layer,
        title: input.title.trim(),
        description: input.description.trim(),
        memberIds: input.memberIds.length ? input.memberIds : memberId ? [memberId] : ["segro"],
        status: "member_draft",
        visibility: "members",
        ha: input.ha,
        landSiteId: input.landSiteId,
        phase: input.phase,
        counterpartSought: input.counterpartSought,
        history: [{ at: new Date().toISOString(), actor: actorLabel, action: "Created member draft" }]
      };
      setItems((prev) => [item, ...prev]);
      return id;
    },
    [actorLabel, memberId]
  );

  const submitForReview = useCallback(
    (id: string) => {
      patchItem(id, { status: "pending_review", submittedAt: new Date().toISOString() }, "Submitted for BER+ review");
    },
    [patchItem]
  );

  const verifyItem = useCallback(
    (id: string) => {
      patchItem(
        id,
        {
          status: "verified",
          verifiedAt: new Date().toISOString(),
          verifiedBy: "BER+ secretariat"
        },
        "Verified in co-inventory"
      );
    },
    [patchItem]
  );

  const requestUpdate = useCallback(
    (id: string, note?: string) => {
      patchItem(id, { status: "needs_update" }, note ? `Flagged: ${note}` : "Flagged for member update");
    },
    [patchItem]
  );

  const resetDemo = useCallback(() => {
    setItems(buildSeedInventory());
  }, []);

  const stats = useMemo(() => {
    const byLayer = {
      assets: { total: 0, verified: 0 },
      land: { total: 0, verified: 0 },
      infrastructure: { total: 0, verified: 0 },
      development: { total: 0, verified: 0 }
    } satisfies Record<InventoryLayerType, { total: number; verified: number }>;
    let verified = 0;
    let pending = 0;
    for (const item of items) {
      byLayer[item.layer].total += 1;
      if (item.status === "verified") {
        verified += 1;
        byLayer[item.layer].verified += 1;
      }
      if (item.status === "pending_review") pending += 1;
    }
    return { total: items.length, verified, pending, byLayer };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      stats,
      actorLabel,
      canActAsMember,
      canActAsSecretariat,
      proposeItem,
      submitForReview,
      verifyItem,
      requestUpdate,
      resetDemo
    }),
    [
      items,
      stats,
      actorLabel,
      canActAsMember,
      proposeItem,
      submitForReview,
      verifyItem,
      requestUpdate,
      resetDemo
    ]
  );

  return (
    <CollaborativeInventoryContext.Provider value={value}>{children}</CollaborativeInventoryContext.Provider>
  );
}

export function useCollaborativeInventory() {
  const ctx = useContext(CollaborativeInventoryContext);
  if (!ctx) throw new Error("useCollaborativeInventory requires CollaborativeInventoryProvider");
  return ctx;
}

export type { ProposeInput };
