"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { CATEGORY_COLORS, getMitgliedById } from "@/data/mitglieder";
import { buildLiveMatches, type LiveMatch } from "@/lib/local-member-matching";
import { buildMatchBrief } from "@/lib/matching-match-brief";
import {
  passedMatchIds,
  recordSwipeDecision,
  savedCount,
  savedMatchIds
} from "@/lib/matching-swipe-store";

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

  const kindColor =
    current?.kind === "land"
      ? "text-emerald-300"
      : current?.kind === "peer"
        ? "text-sky-300"
        : "text-amber-300";

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
          className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/15"
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
                className="relative flex max-h-[min(58vh,560px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-ink-900 to-black shadow-2xl transition-transform duration-200"
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
                  <MemberStrip member={brief.member} coordinationHint={brief.coordinationHint} />

                  <div className="mt-4 flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${kindColor}`}>
                      {current.kind === "osm"
                        ? "OSM asset"
                        : current.kind === "land"
                          ? "Land anchor"
                          : "Peer Mitglied"}
                    </span>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                      match score {Math.round(current.score)}
                    </span>
                  </div>

                  <h3 className="mt-1 text-lg font-semibold leading-snug text-white">{current.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{current.detail}</p>

                  {brief.whyMatch.length ? (
                    <section className="mt-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-amber-200/80">
                        Why this match
                      </h4>
                      <ul className="mt-1.5 space-y-1">
                        {brief.whyMatch.map((line) => (
                          <li key={line} className="flex gap-2 text-[12px] leading-snug text-white/75">
                            <span className="text-amber-400/90">·</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section className="mt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                      Asset & corridor facts
                    </h4>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                      {brief.facts.map((f) => (
                        <div key={`${f.label}-${f.value.slice(0, 24)}`} className="rounded-lg bg-white/5 px-2.5 py-2">
                          <dt className="text-[9px] uppercase tracking-wide text-white/40">{f.label}</dt>
                          <dd className="mt-0.5 text-[11px] leading-snug text-white/80">{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  {brief.peerContext ? (
                    <section className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-sky-200/90">
                        About {getMitgliedById(current.peerMemberId!)?.shortName}
                      </h4>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/70">{brief.peerContext}</p>
                    </section>
                  ) : null}

                  {brief.berPlusNote ? (
                    <section className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/90">
                        BER+ note
                      </h4>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/70">{brief.berPlusNote}</p>
                    </section>
                  ) : null}

                  <p className="mt-4 text-[11px] leading-relaxed text-white/45">{brief.member.intro}</p>

                  {brief.member.quote ? (
                    <blockquote className="mt-3 border-l-2 border-white/20 pl-3 text-[11px] italic text-white/50">
                      &ldquo;{brief.member.quote}&rdquo;
                      {brief.member.quoteAuthor ? (
                        <span className="not-italic text-white/35"> — {brief.member.quoteAuthor}</span>
                      ) : null}
                    </blockquote>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 flex w-full max-w-lg shrink-0 items-center justify-between gap-3 px-1">
              <SwipeBtn label="Pass" sub="← swipe · left click" tone="pass" onClick={() => flyOut("left")} />
              <SwipeBtn label="Save" sub="→ swipe · right click" tone="save" onClick={() => flyOut("right")} />
            </div>
            {onSelectMatch ? (
              <button
                type="button"
                className="mt-2 shrink-0 text-[11px] text-sky-300/80 hover:underline"
                onClick={() => onSelectMatch(current)}
              >
                Open on geo map for full spatial context
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

function MemberStrip({
  member,
  coordinationHint
}: {
  member: NonNullable<ReturnType<typeof getMitgliedById>>;
  coordinationHint: string;
}) {
  const accent = CATEGORY_COLORS[member.category];
  return (
    <div
      className="rounded-xl border border-white/10 bg-black/40 p-3"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-white">{member.shortName}</div>
          <div className="text-[10px] text-white/45">{member.corridorRole}</div>
        </div>
        <a
          href={member.website}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-sky-300/90 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Profile ↗
        </a>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-amber-100/70">{coordinationHint}</p>
    </div>
  );
}

function SwipeBtn({
  label,
  sub,
  tone,
  onClick
}: {
  label: string;
  sub: string;
  tone: "pass" | "save";
  onClick: () => void;
}) {
  const cls =
    tone === "save"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
      : "border-red-500/35 bg-red-500/10 text-red-100 hover:bg-red-500/20";
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-xl border px-3 py-2.5 ${cls}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] opacity-70">{sub}</div>
    </button>
  );
}
