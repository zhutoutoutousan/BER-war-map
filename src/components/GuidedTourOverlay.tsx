"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import { useIsMobile } from "@/lib/use-media";

type Props = {
  onComplete: () => void;
  onSkip: () => void;
  embedded?: boolean;
  sheetOpen?: boolean;
};

const ACT_ORDER: TourAct[] = ["company", "investor", "municipality", "evolution", "finale"];

export function GuidedTourOverlay({ onComplete, onSkip, embedded = true, sheetOpen = false }: Props) {
  const isMobile = useIsMobile();
  const { applyTourAction } = useGuidedTourActions();
  const steps = useMemo(() => getWalkthroughSteps(), []);
  const [index, setIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const step = steps[index]!;
  const isLast = index >= steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;
  const expanded = !minimized;

  useTourSpotlight(expanded ? step.spotlight : undefined);

  useEffect(() => {
    applyTourAction(step.action);
  }, [step.id, applyTourAction]);

  useEffect(() => {
    if (isMobile && sheetOpen && expanded) setMinimized(true);
  }, [isMobile, sheetOpen, expanded]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.guidedTourOpen = expanded && !minimized ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.guidedTourOpen;
    };
  }, [expanded, minimized]);

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setMinimized(false);
    setIndex((i) => i + 1);
  };

  const panel = minimized ? (
    <MinimizedCoach
      index={index}
      total={steps.length}
      title={step.title}
      onExpand={() => setMinimized(false)}
    />
  ) : (
    <ExpandedCoach
      step={step}
      index={index}
      total={steps.length}
      progress={progress}
      isLast={isLast}
      onMinimize={() => setMinimized(true)}
      onSkip={onSkip}
      onBack={() => setIndex((i) => i - 1)}
      onAdvance={advance}
    />
  );

  const wrapClass = isMobile
    ? "guided-tour-mobile-dock pointer-events-none"
    : "pointer-events-none fixed bottom-3 left-3 z-[55] w-[min(calc(100vw-2rem),22rem)]";

  const inner = (
    <div className={`${wrapClass} ${isMobile ? "" : ""}`} data-testid="guided-tour-overlay">
      <div className={isMobile ? "pointer-events-auto" : undefined}>{panel}</div>
    </div>
  );

  if (isMobile && typeof document !== "undefined") {
    return createPortal(inner, document.body);
  }

  return inner;
}

function MinimizedCoach({
  index,
  total,
  title,
  onExpand
}: {
  index: number;
  total: number;
  title: string;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="floating-panel flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left touch-manipulation hover:bg-white/5"
      data-testid="guided-tour-expand"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/25 text-[10px] font-bold text-sky-200">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/85">{title}</span>
      <span className="shrink-0 text-[10px] text-white/40">
        {index + 1}/{total}
      </span>
    </button>
  );
}

function ExpandedCoach({
  step,
  index,
  total,
  progress,
  isLast,
  onMinimize,
  onSkip,
  onBack,
  onAdvance
}: {
  step: DemoWalkthroughStep;
  index: number;
  total: number;
  progress: number;
  isLast: boolean;
  onMinimize: () => void;
  onSkip: () => void;
  onBack: () => void;
  onAdvance: () => void;
}) {
  return (
    <div
      className="guided-tour-panel floating-panel overflow-hidden border-sky-500/30 shadow-lg shadow-black/40"
      role="region"
      aria-label="Live walkthrough"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/10 bg-sky-950/40 px-3 py-2">
        <TourProgress
          title={walkthroughTitle()}
          subtitle={GUIDED_TOUR_SUBTITLE}
          current={index}
          total={total}
          progress={progress}
          currentAct={step.act}
        />
        <button
          type="button"
          onClick={onMinimize}
          className="touch-target shrink-0 rounded-md px-2 text-lg leading-none text-white/45 hover:bg-white/10 hover:text-white/70"
          aria-label="Minimize walkthrough"
          data-testid="guided-tour-minimize"
        >
          −
        </button>
      </div>

      <div className="guided-tour-body px-3 py-2.5">
        <ActTrail currentAct={step.act} />
        <StepView step={step} />
        {step.showEvolution ? <TourEvolutionCards /> : null}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] self-start text-[11px] text-white/40 touch-manipulation hover:text-white/65"
            data-testid="guided-tour-skip"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={onBack}
                className="touch-target min-w-[4.5rem] rounded-lg border border-white/15 px-3 text-xs text-white/70 hover:bg-white/5"
                data-testid="guided-tour-back"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAdvance}
              className="touch-target flex-1 rounded-lg bg-sky-600/90 px-4 text-xs font-semibold text-white hover:bg-sky-500 sm:flex-none"
              data-testid={isLast ? "guided-tour-finish" : "guided-tour-next"}
            >
              {isLast ? "Done · explore" : "Next step"}
            </button>
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
    <div className="mobile-scroll-x -mx-1 mb-2 flex gap-1 px-1 pb-0.5" data-testid="guided-tour-act-trail">
      {ACT_ORDER.map((act, i) => {
        const active = act === currentAct;
        const done = actIndex >= 0 && i < actIndex;
        return (
          <span
            key={act}
            className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wide ${
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
      className="mt-2.5 max-h-[min(22dvh,160px)] space-y-1 overflow-y-auto overscroll-y-contain rounded-md border border-sky-500/20 bg-sky-950/20 p-2"
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
      className="touch-target w-full rounded-lg border border-sky-500/30 bg-sky-950/30 px-3 py-2 text-[11px] font-medium text-sky-200 hover:bg-sky-950/45 sm:w-auto"
      data-testid="guided-tour-replay"
    >
      Replay demo walkthrough →
    </button>
  );
}
