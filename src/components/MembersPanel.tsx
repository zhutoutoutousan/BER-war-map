"use client";

import { useOsmIntel } from "@/context/OsmIntelContext";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  MITGLIEDER,
  type MemberCategory,
  type Mitglied
} from "@/data/mitglieder";

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filterCategory: MemberCategory | "all";
  onFilterCategory: (c: MemberCategory | "all") => void;
};

export function MembersPanel({ selectedId, onSelect, filterCategory, onFilterCategory }: Props) {
  const { data: osmData } = useOsmIntel();
  const memberCounts = osmData?.summary.memberLinkCounts;

  const filtered =
    filterCategory === "all" ? MITGLIEDER : MITGLIEDER.filter((m) => m.category === filterCategory);

  const categories = Object.keys(CATEGORY_LABELS) as MemberCategory[];

  return (
    <div className="flex flex-col gap-3" data-testid="panel-members">
      <div>
        <div className="text-sm font-semibold text-white">Mitglieder</div>
        <div className="mt-1 text-xs text-white/60">
          {MITGLIEDER.length} members — select for your path, linked assets & matching on the map
          {osmData?.summary.memberLinkedTotal != null ? (
            <span className="text-amber-200/80">
              {" "}
              · {osmData.summary.memberLinkedTotal} OSM features tagged
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onFilterCategory("all")}
          className={`rounded-full px-2.5 py-1 text-xs ${
            filterCategory === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/65 hover:bg-white/10"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onFilterCategory(c)}
            className={`rounded-full px-2.5 py-1 text-xs ${
              filterCategory === c ? "text-white" : "text-white/65 hover:bg-white/10"
            }`}
            style={
              filterCategory === c
                ? { backgroundColor: `${CATEGORY_COLORS[c]}33`, border: `1px solid ${CATEGORY_COLORS[c]}66` }
                : { backgroundColor: "rgba(255,255,255,0.05)" }
            }
          >
            {CATEGORY_LABELS[c].split(" ")[0]}
          </button>
        ))}
      </div>

      <ul className="war-room-scroll -mr-1 flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            osmCount={memberCounts?.[m.id]}
            active={selectedId === m.id}
            onClick={() => onSelect(selectedId === m.id ? null : m.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function MemberRow({
  member,
  osmCount,
  active,
  onClick
}: {
  member: Mitglied;
  osmCount?: number;
  active: boolean;
  onClick: () => void;
}) {
  const color = CATEGORY_COLORS[member.category];
  return (
    <li>
      <button
        type="button"
        data-member-id={member.id}
        onClick={onClick}
        className={`w-full rounded-lg px-3 py-2 text-left transition ${
          active ? "bg-white/12 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/8"
        }`}
      >
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
