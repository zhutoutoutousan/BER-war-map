"use client";

import { useMemo, useState } from "react";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  type Contract,
  type ContractStatus
} from "@/data/programme";
import { useProgramme } from "@/context/ProgrammeContext";

const STATUS_COLORS: Record<ContractStatus, string> = {
  planned: "bg-white/10 text-white/60",
  draft: "bg-slate-500/25 text-slate-200",
  "term-sheet": "bg-amber-500/25 text-amber-100",
  signed: "bg-emerald-500/25 text-emerald-100",
  active: "bg-cyan-500/25 text-cyan-100",
  expired: "bg-red-500/20 text-red-200",
  "on-hold": "bg-purple-500/20 text-purple-200"
};

export function ContractsPanel() {
  const { contracts, milestones, focusDate, updateContractStatus } = useProgramme();
  const [filter, setFilter] = useState<ContractStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>("ctr-fbb-ppa");

  const filtered = useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const focusTime = new Date(focusDate).getTime();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-semibold text-white">Contract management</div>
        <p className="mt-1 text-xs text-white/55">
          SPV, PPA, leases, EPC — linked to milestones. Status saved locally.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All ({contracts.length})
        </FilterChip>
        {(["term-sheet", "draft", "signed", "active", "planned"] as ContractStatus[]).map((s) => {
          const n = contracts.filter((c) => c.status === s).length;
          if (!n) return null;
          return (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {CONTRACT_STATUS_LABELS[s]} ({n})
            </FilterChip>
          );
        })}
      </div>

      <ul className="space-y-2">
        {filtered.map((c) => (
          <ContractCard
            key={c.id}
            contract={c}
            milestones={milestones}
            focusTime={focusTime}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
            onStatusChange={(status) => updateContractStatus(c.id, status)}
          />
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] ${
        active ? "bg-sky-500/30 text-sky-100" : "bg-white/5 text-white/55 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function ContractCard({
  contract,
  milestones,
  focusTime,
  expanded,
  onToggle,
  onStatusChange
}: {
  contract: Contract;
  milestones: { id: string; title: string; targetDate: string; status: string }[];
  focusTime: number;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (s: ContractStatus) => void;
}) {
  const linked = milestones.filter((m) => contract.milestoneIds.includes(m.id));
  const overdueEnd = contract.endDate && new Date(contract.endDate).getTime() < focusTime;

  return (
    <li className={`rounded-lg border ${overdueEnd ? "border-amber-500/25" : "border-white/10"} bg-white/5`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-2 px-2 py-2 text-left">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-white">{contract.title}</div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            <span className="rounded bg-white/8 px-1.5 py-px text-[10px] text-white/55">
              {CONTRACT_TYPE_LABELS[contract.type]}
            </span>
            <span className={`rounded px-1.5 py-px text-[10px] ${STATUS_COLORS[contract.status]}`}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </span>
          </div>
        </div>
        <span className="text-white/40">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded ? (
        <div className="border-t border-white/10 px-2 py-2 text-[11px] text-white/70">
          <div className="mb-2">
            <span className="text-white/45">Parties: </span>
            {contract.parties.join(" · ")}
          </div>
          {contract.startDate || contract.endDate ? (
            <div className="mb-2">
              <span className="text-white/45">Term: </span>
              {contract.startDate ?? "—"} → {contract.endDate ?? "—"}
            </div>
          ) : null}
          {contract.notes ? <p className="mb-2 italic text-white/55">{contract.notes}</p> : null}
          {linked.length ? (
            <div className="mb-2">
              <div className="text-white/45">Milestones</div>
              <ul className="mt-1 space-y-0.5">
                {linked.map((m) => (
                  <li key={m.id} className="text-cyan-200/90">
                    {m.title} ({m.targetDate})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <label className="flex items-center gap-2">
            <span className="text-white/45">Status</span>
            <select
              value={contract.status}
              onChange={(e) => onStatusChange(e.target.value as ContractStatus)}
              className="flex-1 rounded border border-white/10 bg-black/60 px-2 py-1 text-[11px] text-white"
            >
              {Object.entries(CONTRACT_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </li>
  );
}
