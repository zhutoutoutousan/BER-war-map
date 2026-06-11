"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACT_COLORS,
  ACT_LABELS,
  getWalkthroughSteps,
  GUIDED_TOUR_SUBTITLE,
  walkthroughTitle,
  type DemoWalkthroughStep,
  type TourAct
} from "@/data/guided-tour";
import { BER_PLUS_FUTURE_EVOLUTION } from "@/data/ber-plus-coordination";
import { useGuidedTourActions } from "@/context/GuidedTourContext";

type Props = {
  onComplete: () => void;
  onSkip: () => void;
  embedded?: boolean;
};

const ACT_ORDER: TourAct[] = ["company", "investor", "municipality", "evolution", "finale"];

export function GuidedTourOverlay({ onComplete, onSkip, embedded = true }: Props) {
  const { applyTourAction } = useGuidedTourActions();
  const steps = useMemo(() => getWalkthroughSteps(), []);
  const [index, setIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const step = steps[index]!;
  const isLast = index >= steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;

  useTourSpotlight(minimized ? undefined : step.spotlight);

  useEffect(() => {
    applyTourAction(step.action);
  }, [step.id, applyTourAction]);

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
  };

  if (minimized) {
    return (
      <div
        className={
          embedded
            ? "pointer-events-auto w-full max-w-[240px] sm:max-w-none"
            : "pointer-events-auto fixed bottom-20 left-3 z-[25] sm:bottom-4"
        }
        data-testid="guided-tour-overlay"
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="floating-panel flex w-full items-center gap-2 px-3 py-2 text-left touch-manipulation hover:bg-white/5"
          data-testid="guided-tour-expand"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/25 text-[10px] font-bold text-sky-200">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/85">
            {step.title}
          </span>
          <span className="shrink-0 text-[10px] text-white/40">
            {index + 1}/{steps.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "pointer-events-auto w-full max-w-md"
          : "pointer-events-auto fixed bottom-20 left-3 z-[25] w-[min(100vw-1.5rem,22rem)] sm:bottom-4"
      }
      role="region"
      aria-label="Live walkthrough"
      data-testid="guided-tour-overlay"
    >
      <div className="floating-panel overflow-hidden border-sky-500/30 shadow-lg shadow-black/40">
        <div className="flex items-start justify-between gap-2 border-b border-white/10 bg-sky-950/40 px-3 py-2">
          <TourProgress
            title={walkthroughTitle()}
            subtitle={GUIDED_TOUR_SUBTITLE}
            current={index}
            total={steps.length}
            progress={progress}
            currentAct={step.act}
          />
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="shrink-0 rounded-md px-2 py-1 text-[10px] text-white/45 hover:bg-white/10 hover:text-white/70"
            aria-label="Minimize walkthrough"
            data-testid="guided-tour-minimize"
          >
            −
          </button>
        </div>

        <div className="px-3 py-2.5">
          <ActTrail currentAct={step.act} />
          <StepView step={step} />
          {step.showEvolution ? <TourEvolutionCards /> : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] text-white/40 hover:text-white/65"
              data-testid="guided-tour-skip"
            >
              Skip tour
            </button>
            <div className="flex gap-1.5">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="min-h-[36px] rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                  data-testid="guided-tour-back"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={advance}
                className="min-h-[36px] rounded-lg bg-sky-600/90 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                data-testid={isLast ? "guided-tour-finish" : "guided-tour-next"}
              >
                {isLast ? "Done · explore" : "Next step"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TourProgress({
  title,
  subtitle,
  current,
  total,
  progress,
  currentAct
}: {
  title: string;
  subtitle: string;
  current: number;
  total: number;
  progress: number;
  currentAct: TourAct;
}) {
  return (
    <div className="min-w-0 flex-1" data-testid="guided-tour-progress">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[10px] text-white/45">
        <span className="font-bold uppercase tracking-[0.1em] text-sky-300/85">{title}</span>
        <span>
          {current + 1}/{total}
          {currentAct !== "intro" ? (
            <span className={` ml-1 ${ACT_COLORS[currentAct]}`}>· {ACT_LABELS[currentAct]}</span>
          ) : null}
        </span>
      </div>
      <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-white/40">{subtitle}</p>
      <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-sky-500/80 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ActTrail({ currentAct }: { currentAct: TourAct }) {
  const actIndex = currentAct === "intro" ? -1 : ACT_ORDER.indexOf(currentAct);

  return (
    <div className="mb-2 flex flex-wrap gap-1" data-testid="guided-tour-act-trail">
      {ACT_ORDER.map((act, i) => {
        const active = act === currentAct;
        const done = actIndex >= 0 && i < actIndex;
        return (
          <span
            key={act}
            className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${
              active
                ? `${ACT_COLORS[act]} bg-white/10 ring-1 ring-white/15`
                : done
                  ? "text-white/35 bg-white/5"
                  : "text-white/25 bg-black/20"
            }`}
          >
            {ACT_LABELS[act]}
          </span>
        );
      })}
    </div>
  );
}

function StepView({ step }: { step: DemoWalkthroughStep }) {
  return (
    <article data-testid={`guided-tour-chapter-${step.id}`}>
      <div className={`text-[9px] font-bold uppercase tracking-[0.14em] ${ACT_COLORS[step.act]}`}>
        {step.stepLabel}
      </div>
      <h2 id="guided-tour-title" className="mt-1 text-sm font-semibold leading-snug text-white">
        {step.title}
      </h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/75">{step.instruction}</p>
    </article>
  );
}

function TourEvolutionCards() {
  const { phases, realismNote } = BER_PLUS_FUTURE_EVOLUTION;

  return (
    <div
      className="mt-2.5 max-h-[min(28vh,200px)] space-y-1 overflow-y-auto rounded-md border border-sky-500/20 bg-sky-950/20 p-2"
      data-testid="guided-tour-evolution"
    >
      {phases.map((phase, i) => (
        <div key={phase.id} className="rounded border border-white/8 bg-black/25 px-2 py-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[10px] font-semibold text-sky-100/95">
              {i + 1}. {phase.label}
            </span>
            <span className="text-[9px] text-white/40">{phase.window}</span>
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-white/60">{phase.platform}</p>
        </div>
      ))}
      <p className="pt-0.5 text-[9px] italic text-white/45">{realismNote}</p>
    </div>
  );
}

function useTourSpotlight(testId?: string) {
  useEffect(() => {
    document.querySelectorAll("[data-tour-spotlight]").forEach((el) => {
      el.removeAttribute("data-tour-spotlight");
    });
    if (!testId) return;

    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (!el) return;

    el.setAttribute("data-tour-spotlight", "true");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });

    return () => {
      el.removeAttribute("data-tour-spotlight");
    };
  }, [testId]);
}

export function GuidedTourReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-sky-500/30 bg-sky-950/30 px-3 py-2 text-[11px] font-medium text-sky-200 hover:bg-sky-950/45"
      data-testid="guided-tour-replay"
    >
      Replay demo walkthrough →
    </button>
  );
}
