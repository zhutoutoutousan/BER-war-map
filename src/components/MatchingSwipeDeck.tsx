"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { getMitgliedById } from "@/data/mitglieder";
import { buildLiveMatches, type LiveMatch } from "@/lib/local-member-matching";
import { buildMatchBrief } from "@/lib/matching-match-brief";
import {
  passedMatchIds,
  recordSwipeDecision,
  savedCount,
  savedMatchIds
} from "@/lib/matching-swipe-store";
import { MatchReviewCard, SwipeActionButtons } from "@/components/MatchReviewCard";

type Props = {
  memberId: string;
  onClose: () => void;
  onSavedChange?: (count: number) => void;
  onSelectMatch?: (match: LiveMatch) => void;
};

const SWIPE_THRESHOLD = 72;

export function MatchingSwipeDeck({ memberId, onClose, onSavedChange, onSelectMatch }: Props) {
  const { data } = useOsmIntel();
  const member = getMitgliedById(memberId);
  const [revision, setRevision] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef({ x: 0, y: 0 });
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);
  const pointerRef = useRef<{ x: number; y: number; active: boolean } | null>(null);

  const queue = useMemo(() => {
    const saved = savedMatchIds(memberId);
    const passed = passedMatchIds(memberId);
    return buildLiveMatches(memberId, data?.geojson ?? null).filter(
      (m) => !saved.has(m.id) && !passed.has(m.id)
    );
  }, [memberId, data?.geojson, revision]);

  const current = queue[0] ?? null;
  const brief = useMemo(
    () => (current ? buildMatchBrief(current, memberId, data?.geojson ?? null) : null),
    [current, memberId, data?.geojson]
  );

  useEffect(() => {
    onSavedChange?.(savedCount(memberId));
  }, [memberId, revision, onSavedChange]);

  const advance = useCallback(
    (decision: "saved" | "passed") => {
      if (!current) return;
      recordSwipeDecision(memberId, current.id, decision);
      setRevision((r) => r + 1);
      setDragX(0);
      setDragY(0);
      setAnimating(null);
      onSavedChange?.(savedCount(memberId));
    },
    [current, memberId, onSavedChange]
  );

  const flyOut = useCallback(
    (dir: "left" | "right") => {
      setAnimating(dir);
      window.setTimeout(() => {
        advance(dir === "right" ? "saved" : "passed");
      }, 220);
    },
    [advance]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (animating || !current) return;
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointerRef.current;
    if (!p?.active || animating) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    dragRef.current = { x: dx, y: dy };
    setDragX(dx);
    setDragY(dy);
  };

  const onPointerUp = () => {
    const p = pointerRef.current;
    if (!p?.active || animating) return;
    pointerRef.current = null;
    const dx = dragRef.current.x;
    if (dx > SWIPE_THRESHOLD) flyOut("right");
    else if (dx < -SWIPE_THRESHOLD) flyOut("left");
    else {
      dragRef.current = { x: 0, y: 0 };
      setDragX(0);
      setDragY(0);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (current) flyOut("right");
  };

  const handleClick = (e: React.MouseEvent) => {
    if (Math.abs(dragX) > 8 || animating || !current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    if (relX < rect.width / 2) flyOut("left");
    else flyOut("right");
  };

  const rotate = dragX * 0.04;
  const opacity = animating ? 0 : 1;
  const tx = animating === "left" ? -420 : animating === "right" ? 420 : dragX;
  const ty = animating ? -40 : dragY * 0.25;

  return (
    <div className="flex h-full flex-col bg-ink-950/95" data-testid="matching-swipe-deck">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-200/90">
            Match review
          </div>
          <p className="text-xs text-white/55">
            {member?.shortName} · {savedCount(memberId)} saved · {queue.length} left
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80 touch-manipulation hover:bg-white/15"
        >
          ← Map
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-hidden p-3 sm:p-4">
        {!current || !brief ? (
          <div className="max-w-sm text-center">
            <p className="text-lg font-semibold text-white">All caught up</p>
            <p className="mt-2 text-sm text-white/50">
              {savedCount(memberId) > 0
                ? `${savedCount(memberId)} matches saved for ${member?.shortName}.`
                : "No pending matches in this queue."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-amber-500/25 px-4 py-2 text-sm text-amber-100"
            >
              Back to network map
            </button>
          </div>
        ) : (
          <>
            <div
              className="relative w-full max-w-lg touch-none select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onContextMenu={handleContextMenu}
              onClick={handleClick}
            >
              <div
                className="relative flex max-h-[min(52dvh,560px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-ink-900 to-black shadow-2xl transition-transform duration-200 sm:max-h-[min(58vh,560px)]"
                style={{
                  transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
                  opacity,
                  boxShadow:
                    dragX > 40
                      ? "0 0 40px rgba(16,185,129,0.35)"
                      : dragX < -40
                        ? "0 0 40px rgba(248,113,113,0.35)"
                        : undefined
                }}
              >
                {dragX > 40 ? (
                  <span className="absolute left-4 top-4 z-10 rotate-[-12deg] rounded border-2 border-emerald-400 px-2 py-1 text-sm font-bold text-emerald-400">
                    SAVE
                  </span>
                ) : null}
                {dragX < -40 ? (
                  <span className="absolute right-4 top-4 z-10 rotate-[12deg] rounded border-2 border-red-400 px-2 py-1 text-sm font-bold text-red-400">
                    PASS
                  </span>
                ) : null}

                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 touch-pan-y"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MatchReviewCard match={current} brief={brief} memberId={memberId} />
                </div>
              </div>
            </div>

            <div className="mt-3 flex w-full max-w-lg shrink-0 items-center justify-between gap-3 px-1 sm:mt-4">
              <SwipeActionButtons onPass={() => flyOut("left")} onSave={() => flyOut("right")} />
            </div>
            {onSelectMatch ? (
              <button
                type="button"
                className="mt-2 shrink-0 text-[11px] text-sky-300/80 hover:underline"
                onClick={() => onSelectMatch(current)}
              >
                Preview on map
              </button>
            ) : null}
          </>
        )}
      </div>

      <p className="shrink-0 border-t border-white/10 px-4 py-2 text-center text-[10px] text-white/40">
        Scroll card for full brief · swipe or click to decide · saved locally on this device
      </p>
    </div>
  );
}
