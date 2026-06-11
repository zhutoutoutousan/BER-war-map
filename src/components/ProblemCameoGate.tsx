"use client";

import { useMemo, useState } from "react";
import {
  cameoForGuest,
  cameoForMemberCategory,
  type CameoBeat,
  type PersonaCameo
} from "@/data/problem-cameo";
import { getMitgliedById } from "@/data/mitglieder";
import { BRAND } from "@/lib/brand";
import { CameoTitleVisual } from "@/components/CameoTitleVisual";
import { PeerPrecedentsStrip } from "@/components/PeerPrecedentsStrip";
import { useUserSession } from "@/context/UserSessionContext";

type Props = {
  onComplete: () => void;
};

export function ProblemCameoGate({ onComplete }: Props) {
  const { session, guestPersona, memberId } = useUserSession();
  const cameo = useMemo((): PersonaCameo | null => {
    if (!session) return null;
    if (session.role === "guest" && guestPersona) return cameoForGuest(guestPersona);
    if (session.role === "member" && memberId) {
      const m = getMitgliedById(memberId);
      if (m) return cameoForMemberCategory(m.category);
    }
    return cameoForGuest("explore");
  }, [session, guestPersona, memberId]);

  const [beatIndex, setBeatIndex] = useState(0);
  const [pickedOption, setPickedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!cameo) return null;

  const beat = cameo.beats[beatIndex]!;
  const isLast = beatIndex >= cameo.beats.length - 1;

  const advance = () => {
    setPickedOption(null);
    setShowFeedback(false);
    if (isLast) {
      onComplete();
      return;
    }
    setBeatIndex((i) => i + 1);
  };

  const pickOption = (id: string) => {
    setPickedOption(id);
    setShowFeedback(true);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/94 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cameo-title"
      data-testid="problem-cameo-gate"
    >
      <div className="war-room-scroll max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/12 bg-ink-900/98 p-5 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6 safe-bottom">
        <CameoProgress current={beatIndex} total={cameo.beats.length} />

        <div className="mt-4 min-h-[280px]">
          <CameoBeatView
            beat={beat}
            cameo={cameo}
            pickedOption={pickedOption}
            showFeedback={showFeedback}
            onPick={pickOption}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {beat.kind === "game" && !showFeedback ? (
            <p className="text-center text-[11px] text-white/45 sm:mr-auto sm:text-left">
              Pick any option — there is no winning move without a shared map.
            </p>
          ) : null}
          <button
            type="button"
            onClick={advance}
            disabled={beat.kind === "game" && !showFeedback}
            className="min-h-[44px] rounded-xl bg-sky-600/90 px-5 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid={isLast ? "cameo-enter-board-room" : "cameo-continue"}
          >
            {beat.kind === "punchline"
              ? "Yes — that's the problem"
              : isLast
                ? `Enter ${BRAND.shortName}`
                : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CameoProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" data-testid="cameo-progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i <= current ? "bg-sky-400/80" : "bg-white/10"}`}
        />
      ))}
    </div>
  );
}

function CameoBeatView({
  beat,
  cameo,
  pickedOption,
  showFeedback,
  onPick
}: {
  beat: CameoBeat;
  cameo: PersonaCameo;
  pickedOption: string | null;
  showFeedback: boolean;
  onPick: (id: string) => void;
}) {
  if (beat.kind === "title") {
    return (
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{beat.caption}</div>
        <h2 id="cameo-title" className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {beat.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/65">{beat.body}</p>
        <CameoTitleVisual persona={cameo.persona} visual={cameo.visual} />
      </div>
    );
  }

  if (beat.kind === "scene") {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white">{beat.heading}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/75">{beat.body}</p>
        <blockquote className="mt-4 border-l-2 border-amber-400/60 pl-3 text-sm italic text-amber-100/90">
          {cameo.scenario}
        </blockquote>
      </div>
    );
  }

  if (beat.kind === "game") {
    const selected = cameo.options.find((o) => o.id === pickedOption);
    return (
      <div>
        <h2 className="text-lg font-semibold text-white">{beat.heading}</h2>
        <p className="mt-2 text-sm text-white/70">{beat.body}</p>
        <div className="mt-4 grid gap-2">
          {cameo.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={showFeedback}
              onClick={() => onPick(opt.id)}
              className={`rounded-lg border px-3 py-2.5 text-left transition touch-manipulation ${
                pickedOption === opt.id
                  ? "border-amber-400/50 bg-amber-950/40"
                  : "border-white/12 bg-black/30 hover:border-white/25"
              } disabled:opacity-80`}
              data-testid={`cameo-option-${opt.id}`}
            >
              <div className="text-sm font-medium text-white">{opt.label}</div>
              <div className="mt-0.5 text-[11px] text-white/55">{opt.detail}</div>
            </button>
          ))}
        </div>
        {showFeedback && selected ? (
          <div
            className="mt-4 rounded-lg border border-amber-500/35 bg-amber-950/35 px-3 py-2.5 text-sm text-amber-100/95"
            data-testid="cameo-game-feedback"
          >
            {selected.feedback}
          </div>
        ) : null}
      </div>
    );
  }

  if (beat.kind === "punchline") {
    return (
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
          The coordination tax
        </div>
        <h2 className="mt-2 text-xl font-semibold text-white">{beat.heading}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70">{beat.body}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300/90">
        A possible response — probe, not product
      </div>
      <h2 className="mt-2 text-lg font-semibold text-white">{beat.heading}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{beat.body}</p>
      <div className="mt-4">
        <PeerPrecedentsStrip compact teaser />
      </div>
      <p className="mt-3 text-[11px] text-white/45">
        Indicative OSM · member links · programme timeline — enter only if the problem resonates.
        A guided tour of each capability follows.
      </p>
    </div>
  );
}
