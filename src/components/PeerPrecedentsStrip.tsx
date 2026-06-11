"use client";

import {
  PEER_APPROACH_HEADLINE,
  PEER_APPROACH_SUB,
  PEER_APPROACH_TYPES,
  resolvePeerExampleUrl,
  type PeerApproachType
} from "@/data/peer-precedents";

type Props = {
  compact?: boolean;
  /** Show one headline example per category (session picker / cameo) */
  teaser?: boolean;
  onOpenBenchmark?: (benchmarkId: string) => void;
};

export function PeerPrecedentsStrip({ compact, teaser, onOpenBenchmark }: Props) {
  return (
    <section
      className={`rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-950/35 to-ink-950/50 ${
        compact ? "px-3 py-2.5" : "px-3 py-3"
      }`}
      data-testid="peer-precedents"
    >
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200/95">
          {PEER_APPROACH_HEADLINE}
        </div>
        {!teaser ? (
          <p className={`mt-1 leading-relaxed text-white/60 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {PEER_APPROACH_SUB}
          </p>
        ) : (
          <p className="mt-1 text-[10px] text-white/55">
            Five proven pattern families — explore sources in Overview after you enter.
          </p>
        )}
      </header>

      <div
        className={`mt-2.5 ${teaser ? "space-y-1.5" : compact ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}`}
      >
        {PEER_APPROACH_TYPES.map((type) => (
          <ApproachBlock
            key={type.id}
            type={type}
            compact={compact}
            teaser={teaser}
            onOpenBenchmark={onOpenBenchmark}
          />
        ))}
      </div>
    </section>
  );
}

function ApproachBlock({
  type,
  compact,
  teaser,
  onOpenBenchmark
}: {
  type: PeerApproachType;
  compact?: boolean;
  teaser?: boolean;
  onOpenBenchmark?: (id: string) => void;
}) {
  const examples = teaser ? type.examples.slice(0, 1) : compact ? type.examples.slice(0, 2) : type.examples;

  return (
    <article
      className="rounded-md border border-white/10 bg-black/25 px-2.5 py-2"
      data-testid={`peer-approach-${type.id}`}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ background: type.accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-white/90 ${compact || teaser ? "text-[11px]" : "text-xs"}`}>
            {type.title}
          </h3>
          {!teaser ? (
            <p className="mt-0.5 text-[10px] leading-snug text-white/50">{type.pitch}</p>
          ) : null}
          <ul className={`${teaser ? "mt-1" : "mt-1.5"} space-y-1`}>
            {examples.map((ex) => (
              <li key={ex.name} className="text-[10px] leading-snug">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <a
                    href={resolvePeerExampleUrl(ex)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sky-300/95 hover:text-sky-200"
                  >
                    {ex.name} ↗
                  </a>
                  <span className="text-white/35">{ex.region}</span>
                  {ex.benchmarkId && onOpenBenchmark ? (
                    <button
                      type="button"
                      onClick={() => onOpenBenchmark(ex.benchmarkId!)}
                      className="rounded bg-violet-500/20 px-1.5 py-px text-[9px] font-medium text-violet-100 hover:bg-violet-500/30"
                      data-testid={`peer-benchmark-${ex.benchmarkId}`}
                    >
                      On map
                    </button>
                  ) : null}
                </div>
                {!teaser ? <div className="mt-0.5 text-white/55">{ex.value}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
