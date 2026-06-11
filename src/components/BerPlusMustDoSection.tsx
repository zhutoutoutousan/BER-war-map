"use client";

import {
  BER_PLUS_PILOT_PHASE,
  PILOT_DELIVERABLE_CATEGORY_LABELS,
  type PilotDeliverable,
  type PilotDeliverableCategory
} from "@/data/ber-plus-coordination";
import { BerPlusRealitySection } from "@/components/BerPlusRealitySection";

type Props = {
  compact?: boolean;
  onGoToProgramme?: () => void;
  onGoToCollabDemo?: () => void;
};

const CATEGORY_ORDER: PilotDeliverableCategory[] = [
  "governance",
  "members",
  "data",
  "coordination",
  "legal",
  "physical"
];

export function BerPlusMustDoSection({ compact, onGoToProgramme, onGoToCollabDemo }: Props) {
  const { headline, subhead, phaseGoal, antiMagic, associationDeliverables, investmentDeliverables, successLooksLike, disclaimer } =
    BER_PLUS_PILOT_PHASE;

  if (compact) {
    return (
      <section
        className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-950/35 to-ink-950/45 px-3 py-2.5"
        data-testid="ber-plus-must-do"
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/95">
          {headline}
        </div>
        <p className="mt-1 text-[11px] font-semibold text-white/85">{subhead}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/55">{antiMagic.title}</p>
        <ul className="mt-2 space-y-1">
          {associationDeliverables.slice(0, 3).map((d) => (
            <li key={d.id} className="text-[10px] text-white/60">
              <span className="font-medium text-violet-200/90">{d.title}</span>
              <span className="text-white/40"> — {d.when}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] italic text-white/40">{disclaimer}</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-950/35 to-ink-950/50 px-3 py-3"
      data-testid="ber-plus-must-do"
    >
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/95">
          {headline}
        </div>
        <h3 className="mt-1.5 text-base font-semibold text-white">{subhead}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-white/65">{phaseGoal}</p>
      </header>

      <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-950/20 px-2.5 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-200/90">
          {antiMagic.title}
        </div>
        <p className="mt-1 text-[10px] text-white/55">{antiMagic.intro}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <CompareColumn title="What you see in this demo" items={antiMagic.demoShows} tone="muted" />
          <CompareColumn title="What BER+ must deliver" items={antiMagic.berPlusDelivers} tone="accent" />
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-[11px] font-semibold text-violet-100/95">
          Association work · BER+ e.V. operations
        </h4>
        <p className="mt-0.5 text-[10px] text-white/45">
          Governance, members, data, and coordination — the unglamorous work that makes the map credible.
        </p>
        <DeliverableList items={associationDeliverables} />
      </div>

      <div className="mt-3">
        <h4 className="text-[11px] font-semibold text-violet-100/95">
          Investment track · Pilot-1 & Phase I milestones
        </h4>
        <p className="mt-0.5 text-[10px] text-white/45">
          Parallel legal and physical path — see Programme tab for contracts and dates.
        </p>
        <DeliverableList items={investmentDeliverables} showLinks />
        {onGoToProgramme ? (
          <button
            type="button"
            onClick={onGoToProgramme}
            className="mt-2 text-[11px] font-medium text-sky-300 hover:text-sky-200"
            data-testid="go-programme-from-must-do"
          >
            Open Programme timeline →
          </button>
        ) : null}
      </div>

      <div className="mt-3 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-2.5 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/90">
          Pilot Phase success looks like
        </div>
        <ul className="mt-1.5 space-y-1">
          {successLooksLike.map((item) => (
            <li key={item} className="flex gap-2 text-[10px] text-white/70">
              <span className="text-emerald-400/90">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {onGoToCollabDemo ? (
          <button
            type="button"
            onClick={onGoToCollabDemo}
            className="mt-2 text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
            data-testid="go-collab-from-must-do"
          >
            Try co-inventory demo (step toward verified rows) →
          </button>
        ) : null}
      </div>

      <p className="mt-2.5 text-[10px] italic text-white/40">{disclaimer}</p>

      <div className="mt-4 border-t border-white/10 pt-4">
        <BerPlusRealitySection variant="full" />
      </div>
    </section>
  );
}

function CompareColumn({
  title,
  items,
  tone
}: {
  title: string;
  items: readonly string[];
  tone: "muted" | "accent";
}) {
  return (
    <div
      className={
        tone === "accent"
          ? "rounded border border-violet-500/20 bg-violet-950/25 px-2 py-1.5"
          : "rounded border border-white/8 bg-black/25 px-2 py-1.5"
      }
    >
      <div className="text-[9px] font-semibold uppercase tracking-wide text-white/50">{title}</div>
      <ul className="mt-1 space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-[10px] leading-snug text-white/65">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeliverableList({
  items,
  showLinks
}: {
  items: readonly PilotDeliverable[];
  showLinks?: boolean;
}) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items.filter((d) => d.category === cat)
  })).filter((g) => g.items.length > 0);

  return (
    <ul className="mt-2 space-y-2">
      {grouped.map(({ category, items: groupItems }) => (
        <li key={category}>
          <div className="text-[9px] font-bold uppercase tracking-wide text-violet-300/70">
            {PILOT_DELIVERABLE_CATEGORY_LABELS[category]}
          </div>
          <ul className="mt-1 space-y-1.5">
            {groupItems.map((d) => (
              <li
                key={d.id}
                className="rounded-md border border-white/10 bg-black/25 px-2.5 py-2"
                data-testid={`pilot-deliverable-${d.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <span className="text-[11px] font-semibold text-white/90">{d.title}</span>
                  <span className="text-[9px] text-white/40">{d.when}</span>
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-white/60">{d.detail}</p>
                <p className="mt-1 text-[9px] text-white/45">
                  <span className="text-violet-300/70">Owner: </span>
                  {d.owner}
                </p>
                {showLinks && d.milestoneId ? (
                  <p className="mt-0.5 text-[9px] text-sky-300/70">
                    Programme · {d.milestoneId}
                    {d.contractId ? ` · ${d.contractId}` : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
