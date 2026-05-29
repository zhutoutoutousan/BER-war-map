"use client";

import { getMitgliedById, CATEGORY_COLORS, type Mitglied } from "@/data/mitglieder";
import { buildMatchBrief, type MatchBrief } from "@/lib/matching-match-brief";
import type { LiveMatch } from "@/lib/local-member-matching";

export function MatchReviewCard({
  match,
  brief,
  memberId,
  compact = false
}: {
  match: LiveMatch;
  brief: MatchBrief;
  memberId: string;
  compact?: boolean;
}) {
  const kindColor =
    match.kind === "land"
      ? "text-emerald-300"
      : match.kind === "peer"
        ? "text-sky-300"
        : "text-amber-300";

  return (
    <div className="flex min-h-0 flex-col">
      <MemberStrip member={brief.member} coordinationHint={brief.coordinationHint} />

      <div className="mt-3 flex items-start justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${kindColor}`}>
          {match.kind === "osm"
            ? "OSM asset"
            : match.kind === "land"
              ? "Land anchor"
              : "Peer Mitglied"}
        </span>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
          match score {Math.round(match.score)}
        </span>
      </div>

      <h3 className={`mt-1 font-semibold leading-snug text-white ${compact ? "text-base" : "text-lg"}`}>
        {match.title}
      </h3>
      <p className="mt-1 text-sm text-white/60">{match.detail}</p>

      {brief.whyMatch.length ? (
        <section className="mt-3">
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

      <section className="mt-3">
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
        <section className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-sky-200/90">
            About {getMitgliedById(match.peerMemberId!)?.shortName}
          </h4>
          <p className="mt-1 text-[12px] leading-relaxed text-white/70">{brief.peerContext}</p>
        </section>
      ) : null}

      {brief.berPlusNote ? (
        <section className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/90">BER+ note</h4>
          <p className="mt-1 text-[12px] leading-relaxed text-white/70">{brief.berPlusNote}</p>
        </section>
      ) : null}

      {!compact ? (
        <p className="mt-3 text-[11px] leading-relaxed text-white/45">{brief.member.intro}</p>
      ) : null}
    </div>
  );
}

function MemberStrip({
  member,
  coordinationHint
}: {
  member: Mitglied;
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
        >
          Profile ↗
        </a>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-amber-100/70">{coordinationHint}</p>
    </div>
  );
}

export function SwipeActionButtons({
  onPass,
  onSave
}: {
  onPass: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex gap-2">
      <SwipeBtn label="Pass" sub="← swipe" tone="pass" onClick={onPass} />
      <SwipeBtn label="Save" sub="→ swipe" tone="save" onClick={onSave} />
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
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[48px] flex-1 rounded-xl border px-3 py-2.5 touch-manipulation ${cls}`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] opacity-70 max-sm:hidden">{sub}</div>
    </button>
  );
}
