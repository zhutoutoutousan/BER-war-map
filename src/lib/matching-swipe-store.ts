/** Saved / passed matches from swipe review (localStorage). */

export type SwipeDecision = "saved" | "passed";

export type SwipeEntry = {
  matchId: string;
  memberId: string;
  decision: SwipeDecision;
  at: string;
};

const STORAGE_KEY = "ber-matching-swipe-v1";

export type SwipeStore = {
  entries: SwipeEntry[];
};

function load(): SwipeStore {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as SwipeStore;
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch {
    return { entries: [] };
  }
}

function save(store: SwipeStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function recordSwipeDecision(
  memberId: string,
  matchId: string,
  decision: SwipeDecision
): SwipeStore {
  const store = load();
  const without = store.entries.filter(
    (e) => !(e.memberId === memberId && e.matchId === matchId)
  );
  without.push({ memberId, matchId, decision, at: new Date().toISOString() });
  const next = { entries: without };
  save(next);
  return next;
}

export function getSwipeDecision(
  memberId: string,
  matchId: string
): SwipeDecision | null {
  const hit = load().entries.find((e) => e.memberId === memberId && e.matchId === matchId);
  return hit?.decision ?? null;
}

export function savedMatchIds(memberId: string): Set<string> {
  return new Set(
    load()
      .entries.filter((e) => e.memberId === memberId && e.decision === "saved")
      .map((e) => e.matchId)
  );
}

export function passedMatchIds(memberId: string): Set<string> {
  return new Set(
    load()
      .entries.filter((e) => e.memberId === memberId && e.decision === "passed")
      .map((e) => e.matchId)
  );
}

export function savedCount(memberId: string): number {
  return savedMatchIds(memberId).size;
}

export function clearSwipeHistory(memberId?: string) {
  if (!memberId) {
    save({ entries: [] });
    return;
  }
  const store = load();
  save({ entries: store.entries.filter((e) => e.memberId !== memberId) });
}
