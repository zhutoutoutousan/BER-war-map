"use client";

import { useOsmIntel } from "@/context/OsmIntelContext";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  MITGLIEDER,
  type MemberCategory,
  type Mitglied
} from "@/data/mitglieder";
import { GUEST_PERSONAS, type GuestPersona } from "@/lib/guest-personas";

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filterCategory: MemberCategory | "all";
  onFilterCategory: (c: MemberCategory | "all") => void;
  guestPersona?: GuestPersona | null;
};

export function MembersPanel({
  selectedId,
  onSelect,
  filterCategory,
  onFilterCategory,
  guestPersona
}: Props) {
  const { data: osmData } = useOsmIntel();
  const memberCounts = osmData?.summary.memberLinkCounts;
  const personaConfig = guestPersona ? GUEST_PERSONAS[guestPersona] : null;

  const filtered =
    filterCategory === "all" ? MITGLIEDER : MITGLIEDER.filter((m) => m.category === filterCategory);

  const categories = Object.keys(CATEGORY_LABELS) as MemberCategory[];

  return (
    <div className="flex flex-col gap-3" data-testid="panel-members">
      {personaConfig && filterCategory !== "all" ? (
        <div
          className={`rounded-lg border px-2.5 py-2 ${personaConfig.accent.border} bg-black/25`}
          data-testid="members-persona-filter-hint"
        >
          <div className={`text-xs font-semibold ${personaConfig.accent.text}`}>
            Filtered for {personaConfig.shortLabel} view
          </div>
          <div className="mt-0.5 text-[11px] text-white/55">
            Showing {filtered.length} {CATEGORY_LABELS[filterCategory].toLowerCase()} Mitglieder — tap to
            focus on map
          </div>
        </div>
      ) : null}

      <div>
        <div className="text-sm font-semibold text-white">Mitglieder</div>
        <div className="mt-1 text-xs text-white/60">
          {filtered.length} of {MITGLIEDER.length} members
          {osmData?.summary.memberLinkedTotal != null ? (
            <span className="text-amber-200/80">
              {" "}
              · {osmData.summary.memberLinkedTotal} OSM features tagged
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        <FilterChip
          active={filterCategory === "all"}
          onClick={() => onFilterCategory("all")}
          label="All"
        />
        {categories.map((c) => (
          <FilterChip
            key={c}
            active={filterCategory === c}
            onClick={() => onFilterCategory(c)}
            label={CATEGORY_LABELS[c].split(" ")[0]}
            color={CATEGORY_COLORS[c]}
            emphasized={personaConfig?.filterCategory === c}
          />
        ))}
      </div>

      <ul className="war-room-scroll -mr-1 flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            osmCount={memberCounts?.[m.id]}
            active={selectedId === m.id}
            demoPick={personaConfig?.demoMemberId === m.id}
            onClick={() => onSelect(selectedId === m.id ? null : m.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
  emphasized
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  emphasized?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? emphasized
            ? "text-white ring-2 ring-white/40"
            : "text-white"
          : emphasized
            ? "text-white/80 ring-1 ring-white/25 hover:bg-white/10"
            : "text-white/65 hover:bg-white/10"
      }`}
      style={
        active && color
          ? {
              backgroundColor: `${color}${emphasized ? "55" : "33"}`,
              border: `1px solid ${color}${emphasized ? "cc" : "66"}`
            }
          : emphasized && color
            ? { backgroundColor: `${color}18`, border: `1px solid ${color}44` }
            : active
              ? { backgroundColor: "rgba(255,255,255,0.15)" }
              : { backgroundColor: "rgba(255,255,255,0.05)" }
      }
    >
      {emphasized && !active ? "→ " : null}
      {label}
    </button>
  );
}

function MemberRow({
  member,
  osmCount,
  active,
  demoPick,
  onClick
}: {
  member: Mitglied;
  osmCount?: number;
  active: boolean;
  demoPick?: boolean;
  onClick: () => void;
}) {
  const color = CATEGORY_COLORS[member.category];
  return (
    <li>
      <button
        type="button"
        data-testid={`member-row-${member.id}`}
        data-member-id={member.id}
        onClick={onClick}
        className={`relative w-full rounded-lg px-3 py-2 text-left transition ${
          active
            ? "bg-white/12 ring-2 ring-white/25"
            : demoPick
              ? "bg-white/8 ring-1 ring-violet-400/45 hover:bg-white/10"
              : "bg-white/5 hover:bg-white/8"
        }`}
      >
        {demoPick ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-violet-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            Demo
          </span>
        ) : null}
        <div className="flex items-start gap-2">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}99` }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium text-white">{member.shortName}</div>
              <a
                href={member.website}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-[10px] text-sky-300/80 hover:text-sky-200"
                title={member.website}
              >
                ↗
              </a>
            </div>
            <div className="line-clamp-2 text-xs text-white/55">{member.corridorRole}</div>
            {osmCount != null && osmCount > 0 ? (
              <div className="mt-0.5 font-mono text-[10px] text-amber-300/85">{osmCount} OSM linked</div>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}
