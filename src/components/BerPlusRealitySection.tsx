"use client";

import {
  BER_PLUS_CONTRIBUTIONS,
  BER_PLUS_FUTURE_EVOLUTION,
  type BerPlusContributionArea,
  type PlatformEvolutionPhase
} from "@/data/ber-plus-coordination";

type Variant = "welcome" | "full" | "contributions" | "future";

type Props = {
  variant?: Variant;
};

export function BerPlusRealitySection({ variant = "full" }: Props) {
  if (variant === "contributions") {
    return <ContributionsBlock compact={false} showFutureTeaser={false} />;
  }
  if (variant === "future") {
    return <FutureBlock compact={false} />;
  }
  if (variant === "welcome") {
    return (
      <div className="space-y-3" data-testid="ber-plus-reality-welcome">
        <ContributionsBlock compact showFutureTeaser={false} />
        <FutureBlock compact />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ber-plus-reality">
      <ContributionsBlock compact={false} showFutureTeaser={false} />
      <FutureBlock compact={false} />
    </div>
  );
}

function ContributionsBlock({
  compact,
  showFutureTeaser
}: {
  compact: boolean;
  showFutureTeaser: boolean;
}) {
  const { headline, intro, areas } = BER_PLUS_CONTRIBUTIONS;

  return (
    <section
      className="rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-950/30 to-ink-950/45 px-3 py-2.5"
      data-testid="ber-plus-contributions"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/95">
        {headline}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/60">{intro}</p>

      <ul className={`mt-2.5 ${compact ? "space-y-1.5" : "space-y-2"}`}>
        {areas.map((area) => (
          <ContributionCard key={area.id} area={area} compact={compact} />
        ))}
      </ul>

      {showFutureTeaser ? (
        <p className="mt-2 text-[10px] text-white/45">Future Phase evolution → see guided tour finale.</p>
      ) : null}
    </section>
  );
}

function ContributionCard({ area, compact }: { area: BerPlusContributionArea; compact: boolean }) {
  if (compact) {
    return (
      <li
        className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5"
        data-testid={`contribution-${area.id}`}
      >
        <div className="text-[10px] font-semibold text-violet-100/95">{area.title}</div>
        <p className="mt-0.5 text-[10px] text-white/55">{area.berPlusRole}</p>
      </li>
    );
  }

  return (
    <li
      className="rounded-md border border-white/10 bg-black/25 px-2.5 py-2"
      data-testid={`contribution-${area.id}`}
    >
      <div className="text-[11px] font-semibold text-violet-100/95">{area.title}</div>
      <dl className="mt-1.5 space-y-1 text-[10px]">
        <div>
          <dt className="font-medium text-violet-300/75">BER+</dt>
          <dd className="text-white/65">{area.berPlusRole}</dd>
        </div>
        <div>
          <dt className="font-medium text-sky-300/75">Members</dt>
          <dd className="text-white/65">{area.memberRole}</dd>
        </div>
        <div>
          <dt className="font-medium text-emerald-300/75">Pilot example</dt>
          <dd className="text-white/60">{area.pilotExample}</dd>
        </div>
      </dl>
    </li>
  );
}

function FutureBlock({ compact }: { compact: boolean }) {
  const { headline, intro, phases, realismNote } = BER_PLUS_FUTURE_EVOLUTION;

  return (
    <section
      className="rounded-lg border border-sky-500/25 bg-gradient-to-br from-sky-950/30 to-ink-950/45 px-3 py-2.5"
      data-testid="ber-plus-future-evolution"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200/95">
        {headline}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/60">{intro}</p>

      <ol className={`mt-2.5 ${compact ? "space-y-1.5" : "space-y-2"}`}>
        {phases.map((phase, index) => (
          <EvolutionStep key={phase.id} phase={phase} step={index + 1} compact={compact} />
        ))}
      </ol>

      <p className="mt-2 text-[10px] italic text-white/45">{realismNote}</p>
    </section>
  );
}

function EvolutionStep({
  phase,
  step,
  compact
}: {
  phase: PlatformEvolutionPhase;
  step: number;
  compact: boolean;
}) {
  if (compact) {
    return (
      <li
        className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5"
        data-testid={`evolution-${phase.id}`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-semibold text-sky-100/95">{phase.label}</span>
          <span className="text-[9px] text-white/40">{phase.window}</span>
        </div>
        <p className="mt-0.5 text-[10px] text-white/55">{phase.platform}</p>
      </li>
    );
  }

  return (
    <li
      className="rounded-md border border-white/10 bg-black/25 px-2.5 py-2"
      data-testid={`evolution-${phase.id}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-200">
          {step}
        </span>
        <div>
          <div className="text-[11px] font-semibold text-sky-100/95">{phase.label}</div>
          <div className="text-[9px] text-white/40">{phase.window}</div>
        </div>
      </div>
      <dl className="mt-1.5 space-y-1 pl-7 text-[10px]">
        <div>
          <dt className="font-medium text-sky-300/75">Platform</dt>
          <dd className="text-white/65">{phase.platform}</dd>
        </div>
        <div>
          <dt className="font-medium text-violet-300/75">BER+ role</dt>
          <dd className="text-white/65">{phase.berPlusRole}</dd>
        </div>
        <div>
          <dt className="font-medium text-emerald-300/75">Members gain</dt>
          <dd className="text-white/60">{phase.membersGain}</dd>
        </div>
      </dl>
    </li>
  );
}
