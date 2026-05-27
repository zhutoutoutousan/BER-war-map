"use client";

import {
  MILESTONE_STATUS_LABELS,
  PHASES,
  dateToProgress,
  phaseForDate,
  progressToDate,
  type Milestone,
  type PhaseId
} from "@/data/programme";
import { useProgramme } from "@/context/ProgrammeContext";

const PHASE_COLORS: Record<PhaseId, string> = {
  I: "rgba(16, 185, 129, 0.35)",
  II: "rgba(56, 189, 248, 0.35)",
  III: "rgba(167, 139, 250, 0.35)"
};

type Props = {
  compact?: boolean;
};

export function TimelineControl({ compact }: Props) {
  const { focusDate, setFocusDate, milestones } = useProgramme();
  const progress = dateToProgress(focusDate);
  const phase = phaseForDate(focusDate);
  const phaseMeta = PHASES.find((p) => p.id === phase)!;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <div>
          <div className="text-sm font-semibold text-white">Programme timeline</div>
          <p className="mt-1 text-xs text-white/55">Scrub to simulate corridor delivery date — syncs map phase overlay.</p>
        </div>
      ) : null}

      <div className="rounded-lg border border-white/10 bg-black/40 p-2">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium text-cyan-200">{phaseMeta.label}</span>
          <span className="text-white/50">{focusDate}</span>
        </div>

        {/* Phase bands */}
        <div className="relative mb-1 h-2 overflow-hidden rounded-full bg-white/5">
          {PHASES.map((p) => {
            const left = dateToProgress(p.startDate) * 100;
            const width = (dateToProgress(p.endDate) - dateToProgress(p.startDate)) * 100;
            return (
              <div
                key={p.id}
                className="absolute top-0 h-full"
                style={{ left: `${left}%`, width: `${width}%`, background: PHASE_COLORS[p.id] }}
                title={p.label}
              />
            );
          })}
        </div>

        {/* Milestone ticks */}
        <div className="relative mb-2 h-3">
          {milestones.map((m) => (
            <MilestoneTick key={m.id} milestone={m} onPick={() => setFocusDate(m.targetDate)} />
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => setFocusDate(progressToDate(Number(e.target.value) / 1000))}
          className="timeline-slider w-full"
          aria-label="Programme timeline"
        />

        <div className="mt-2 flex flex-wrap gap-1">
          {PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFocusDate(p.startDate)}
              className={`rounded px-2 py-0.5 text-[10px] ${
                phase === p.id ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:text-white/70"
              }`}
            >
              {p.id}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFocusDate(new Date().toISOString().slice(0, 10))}
            className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/50 hover:text-white/70"
          >
            Today
          </button>
        </div>
      </div>

      {!compact ? <MilestoneList milestones={milestones} focusDate={focusDate} /> : null}
    </div>
  );
}

function MilestoneTick({ milestone, onPick }: { milestone: Milestone; onPick: () => void }) {
  const left = dateToProgress(milestone.targetDate) * 100;
  const color =
    milestone.status === "done"
      ? "#10b981"
      : milestone.status === "at-risk"
        ? "#f59e0b"
        : milestone.status === "blocked"
          ? "#ef4444"
          : "#38bdf8";

  return (
    <button
      type="button"
      title={`${milestone.title} (${milestone.targetDate})`}
      onClick={onPick}
      className="absolute top-0 h-3 w-1 -translate-x-1/2 rounded-sm transition hover:scale-125"
      style={{ left: `${left}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

function MilestoneList({ milestones, focusDate }: { milestones: Milestone[]; focusDate: string }) {
  const { updateMilestoneStatus } = useProgramme();
  const focusTime = new Date(focusDate).getTime();

  const sorted = [...milestones].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">Milestones</div>
      <ul className="space-y-1.5">
        {sorted.map((m) => {
          const due = new Date(m.targetDate).getTime();
          const overdue = due < focusTime && m.status !== "done";
          return (
            <li
              key={m.id}
              className={`rounded-lg px-2 py-1.5 text-xs ${
                overdue ? "border border-amber-500/30 bg-amber-500/10" : "bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-white/90">{m.title}</div>
                  <div className="text-[10px] text-white/45">
                    {m.targetDate} · Phase {m.phase}
                  </div>
                </div>
                <select
                  value={m.status}
                  onChange={(e) => updateMilestoneStatus(m.id, e.target.value as Milestone["status"])}
                  className="max-w-[100px] rounded border border-white/10 bg-black/60 px-1 py-0.5 text-[10px] text-white/80"
                >
                  {Object.entries(MILESTONE_STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
