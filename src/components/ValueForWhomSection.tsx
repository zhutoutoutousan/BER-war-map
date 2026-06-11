"use client";

import { useMemo, useState } from "react";
import type { LeftTab } from "@/components/BerPlusValuePanel";
import {
  aggregateOutcomeScores,
  CORRIDOR_VALUE_ANCHORS,
  GENIUS_IDEA,
  STAKEHOLDER_VALUES,
  VALUE_OUTCOME_LABELS,
  stakeholderForPersona,
  type StakeholderValue,
  type ValueOutcome
} from "@/data/value-by-stakeholder";
import type { GuestPersona } from "@/lib/guest-personas";
import { useUserSession } from "@/context/UserSessionContext";
import { GuidedTourReplayButton } from "@/components/GuidedTourOverlay";

type Props = {
  guestPersona?: GuestPersona | null;
  onGoToTab?: (tab: LeftTab) => void;
  onOpenMatching?: () => void;
};

export function ValueForWhomSection({ guestPersona, onGoToTab, onOpenMatching }: Props) {
  const { replayGuidedTour } = useUserSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const highlighted = stakeholderForPersona(guestPersona);
  const outcomes = useMemo(() => aggregateOutcomeScores(), []);

  const sorted = useMemo(() => {
    if (!highlighted) return STAKEHOLDER_VALUES;
    return [
      highlighted,
      ...STAKEHOLDER_VALUES.filter((s) => s.id !== highlighted.id)
    ];
  }, [highlighted]);

  return (
    <section
      className="rounded-lg border border-sky-500/30 bg-gradient-to-br from-sky-950/35 to-ink-950/50 px-3 py-3"
      data-testid="value-for-whom"
    >
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-200/95">
          What value does this create?
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">
          A neutral BER+ surface — faster matching, visible assets, captured inquiries, and one
          Flughafenregion story. Numbers below are probe targets, not audited KPIs.
        </p>
      </header>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {outcomes.map(({ outcome, score, label }) => (
          <span
            key={outcome}
            className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] text-white/55"
            title={`${score} stakeholder groups primary benefit`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {sorted.map((s) => (
          <StakeholderCard
            key={s.id}
            stakeholder={s}
            highlighted={highlighted?.id === s.id}
            open={expandedId === s.id}
            onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
          />
        ))}
      </div>

      <GeniusIdeaCallout onGoToTab={onGoToTab} onOpenMatching={onOpenMatching} />

      <p className="mt-2 text-[9px] text-white/35">
        Corridor scale today: {CORRIDOR_VALUE_ANCHORS.mitglieder} Mitglieder ·{" "}
        {CORRIDOR_VALUE_ANCHORS.landAnchors} land anchors · {CORRIDOR_VALUE_ANCHORS.developableHaNote}
      </p>

      <div className="mt-2.5">
        <GuidedTourReplayButton onClick={replayGuidedTour} />
      </div>
    </section>
  );
}

function StakeholderCard({
  stakeholder,
  highlighted,
  open,
  onToggle
}: {
  stakeholder: StakeholderValue;
  highlighted: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`rounded-md border px-2.5 py-2 ${
        highlighted
          ? "border-sky-400/40 bg-sky-950/35 ring-1 ring-sky-400/25"
          : "border-white/10 bg-black/25"
      }`}
      data-testid={`value-stakeholder-${stakeholder.id}`}
    >
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-white/90">{stakeholder.label}</div>
            <div className="mt-0.5 text-[10px] leading-snug text-white/55">{stakeholder.headline}</div>
          </div>
          <span className="text-[10px] text-white/35">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open ? (
        <div className="mt-2 space-y-2 border-t border-white/8 pt-2">
          <ul className="space-y-1 text-[10px] text-white/65">
            {stakeholder.benefits.map((b) => (
              <li key={b} className="flex gap-1.5">
                <span className="text-emerald-400/80">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <dl className="grid gap-1 rounded border border-white/8 bg-black/20 px-2 py-1.5">
            {stakeholder.metrics.map((m) => (
              <div key={m.label} className="text-[9px]">
                <dt className="text-white/40">{m.label}</dt>
                <dd className="font-medium text-emerald-100/90">{m.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-1">
            {stakeholder.primaryOutcomes.map((o) => (
              <OutcomeChip key={o} outcome={o} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function OutcomeChip({ outcome }: { outcome: ValueOutcome }) {
  return (
    <span className="rounded bg-white/8 px-1.5 py-px text-[8px] uppercase tracking-wide text-white/45">
      {VALUE_OUTCOME_LABELS[outcome]}
    </span>
  );
}

function GeniusIdeaCallout({
  onGoToTab,
  onOpenMatching
}: {
  onGoToTab?: (tab: LeftTab) => void;
  onOpenMatching?: () => void;
}) {
  return (
    <div
      className="mt-3 rounded-lg border border-amber-500/35 bg-gradient-to-br from-amber-950/40 to-black/40 px-3 py-2.5"
      data-testid="genius-idea-ledger"
    >
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200/90">
        The big idea · probe
      </div>
      <h3 className="mt-1 text-sm font-semibold text-white">
        {GENIUS_IDEA.title}
        <span className="ml-1.5 text-[11px] font-normal text-white/45">({GENIUS_IDEA.titleDe})</span>
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-white/70">{GENIUS_IDEA.pitch}</p>
      <p className="mt-1.5 text-[10px] italic text-amber-100/75">{GENIUS_IDEA.whyGenius}</p>
      <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[10px] text-white/55">
        {GENIUS_IDEA.workflow.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {GENIUS_IDEA.probeTargets.map((t) => (
          <div key={t.label} className="rounded border border-white/8 bg-black/25 px-2 py-1 text-[9px]">
            <div className="text-white/40">{t.label}</div>
            <div className="text-amber-100/90">{t.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {onOpenMatching ? (
          <button
            type="button"
            onClick={onOpenMatching}
            className="rounded-lg bg-amber-600/30 px-3 py-1.5 text-[11px] font-medium text-amber-100 hover:bg-amber-600/40"
            data-testid="genius-idea-matching"
          >
            See Pass · Save matching →
          </button>
        ) : null}
        {onGoToTab ? (
          <button
            type="button"
            onClick={() => onGoToTab("inventory")}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/5"
          >
            Asset mgmt · raise match confidence →
          </button>
        ) : null}
      </div>
    </div>
  );
}
