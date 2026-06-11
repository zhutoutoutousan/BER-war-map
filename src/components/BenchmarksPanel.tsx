"use client";

import { useMemo, useState } from "react";
import {
  BENCHMARK_CATEGORIES,
  BENCHMARK_CATEGORY_COLORS,
  BENCHMARKS,
  getBenchmarkById,
  PITCH_READINESS,
  type Benchmark,
  type BenchmarkCategory
} from "@/data/benchmarks";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { buildBenchmarkMatches } from "@/lib/benchmark-matching";
import { BRAND } from "@/lib/brand";

const CATEGORY_ORDER: BenchmarkCategory[] = [
  "airport-region",
  "location-intelligence",
  "invest-portal",
  "stakeholder-dashboard"
];

type Props = {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onShowOnMap?: (id: string) => void;
  onShowAllOnMap?: () => void;
  osmFeatureCount?: number;
  osmLoading?: boolean;
};

export function BenchmarksPanel({
  selectedId,
  onSelect,
  onShowOnMap,
  onShowAllOnMap,
  osmFeatureCount,
  osmLoading
}: Props) {
  const { data: osmData, activeRegionId } = useOsmIntel();
  const [expanded, setExpanded] = useState<string | null>("ber-osm-prototype");
  const [categoryFilter, setCategoryFilter] = useState<BenchmarkCategory | "all">("all");

  const activeMatches = useMemo(() => {
    const b = selectedId ? getBenchmarkById(selectedId) : null;
    if (!b || activeRegionId !== selectedId) return [];
    return buildBenchmarkMatches(b, osmData?.geojson ?? null);
  }, [selectedId, activeRegionId, osmData?.geojson]);

  const visible =
    categoryFilter === "all" ? BENCHMARKS : BENCHMARKS.filter((b) => b.category === categoryFilter);

  return (
    <div className="flex flex-col gap-4" data-testid="panel-benchmarks">
      <header className="rounded-lg border border-violet-500/25 bg-violet-950/25 px-3 py-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200/90">
          Map benchmarks · drill-down
        </div>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          Teleport the Board Room to corridor sites above — programme, stakeholders, matching patterns,
          and sources on each card.
        </p>
        {onShowAllOnMap ? (
          <button
            type="button"
            onClick={onShowAllOnMap}
            className="mt-2 w-full rounded-md bg-violet-500/25 py-2 text-[11px] font-medium text-violet-100 hover:bg-violet-500/35"
            data-testid="show-all-benchmarks-on-map"
          >
            Show all benchmarks on map
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-1">
        <FilterChip
          active={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
          label={`All (${BENCHMARKS.length})`}
        />
        {CATEGORY_ORDER.map((cat) => {
          const count = BENCHMARKS.filter((b) => b.category === cat).length;
          if (!count) return null;
          return (
            <FilterChip
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              label={BENCHMARK_CATEGORIES[cat].split(" ")[0]}
              color={BENCHMARK_CATEGORY_COLORS[cat]}
              count={count}
            />
          );
        })}
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Friday pitch checklist
        </h3>
        <ul className="mt-2 space-y-1.5">
          {PITCH_READINESS.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-white/8 bg-black/25 px-2.5 py-2 text-[11px]"
            >
              <span className="font-semibold text-sky-200">{item.label}</span>
              <span className="text-white/55"> — {item.detail}</span>
              <div className="mt-1 text-[10px] text-emerald-200/80">In {BRAND.shortName}: {item.inApp}</div>
            </li>
          ))}
        </ul>
      </section>

      {selectedId ? (
        <section className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/80">
            OSM intel · matching
          </div>
          {osmLoading ? (
            <p className="mt-1 text-[11px] text-amber-200/80">Loading Overpass OSM layers…</p>
          ) : osmFeatureCount ? (
            <p className="mt-1 text-[10px] text-white/45">
              {osmFeatureCount.toLocaleString()} OSM features on map
            </p>
          ) : activeRegionId !== selectedId ? (
            <p className="mt-1 text-[11px] text-white/55">Select or click map pin to load regional OSM…</p>
          ) : null}
          {!osmLoading && activeMatches.length ? (
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
              {activeMatches.slice(0, 8).map((m) => (
                <li key={m.id} className="text-[10px] text-white/65">
                  <span className="font-medium text-emerald-200">{m.stakeholder}</span>
                  <span className="text-white/40"> → </span>
                  <span>{m.osmTitle ?? m.pattern}</span>
                </li>
              ))}
            </ul>
          ) : !osmLoading ? (
            <p className="mt-1 text-[11px] text-white/55">
              Matching links appear once regional OSM is loaded.
            </p>
          ) : null}
        </section>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const items = visible.filter((b) => b.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {BENCHMARK_CATEGORIES[cat]}
            </h3>
            <ul className="mt-2 space-y-2">
              {items.map((b) => (
                <BenchmarkCard
                  key={b.id}
                  benchmark={b}
                  open={expanded === b.id}
                  selected={selectedId === b.id}
                  onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                  onShowOnMap={onShowOnMap ? () => onShowOnMap(b.id) : undefined}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
  count
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium touch-manipulation ${
        active ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:text-white/70"
      }`}
    >
      {color ? (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      ) : null}
      {label}
      {count != null ? ` (${count})` : ""}
    </button>
  );
}

function BenchmarkCard({
  benchmark,
  open,
  selected,
  onToggle,
  onShowOnMap,
  onSelect
}: {
  benchmark: Benchmark;
  open: boolean;
  selected?: boolean;
  onToggle: () => void;
  onShowOnMap?: () => void;
  onSelect?: (id: string | null) => void;
}) {
  const isPrototype = benchmark.id === "ber-osm-prototype";
  const catColor = BENCHMARK_CATEGORY_COLORS[benchmark.category];

  const cardClass = `rounded-lg border transition ${
    selected
      ? "border-violet-400/50 bg-violet-950/40 ring-1 ring-violet-400/30"
      : isPrototype
        ? "border-sky-500/35 bg-sky-950/30"
        : "border-white/10 bg-white/5"
  }`;

  return (
    <li className={cardClass}>
      <button
        type="button"
        data-testid={`benchmark-${benchmark.id}`}
        onClick={() => {
          onToggle();
          onSelect?.(benchmark.id);
        }}
        className="w-full px-3 py-2.5 text-left hover:bg-white/5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: catColor }}
                title={BENCHMARK_CATEGORIES[benchmark.category]}
              />
              <div className="text-sm font-semibold text-white">{benchmark.name}</div>
            </div>
            <div className="text-[10px] text-white/45">{benchmark.region}</div>
          </div>
          <span className="text-[10px] text-white/40">{open ? "▲" : "▼"}</span>
        </div>
        {!open ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-white/60">{benchmark.whatTheyDo}</p>
        ) : null}
      </button>
      {open ? (
          <div className="space-y-2 border-t border-white/8 px-3 pb-2.5 pt-2 text-[11px] leading-relaxed">
            <p className="text-white/75">{benchmark.whatTheyDo}</p>
            <p>
              <span className="font-medium text-amber-200/90">Evidence: </span>
              <span className="text-white/65">{benchmark.evidence}</span>
            </p>
            <p>
              <span className="font-medium text-emerald-200/90">For BER+: </span>
              <span className="text-white/65">{benchmark.lessonForBerPlus}</span>
            </p>

            {benchmark.programme ? (
              <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  Programme
                </div>
                <div className="mt-0.5 text-[11px] text-white/70">
                  {benchmark.programme.phaseLabel}
                  <span className="text-white/40"> · {benchmark.programme.horizon}</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {benchmark.programme.milestones.map((m) => (
                    <li key={m.label} className="flex gap-1.5 text-[10px] text-white/55">
                      <MilestoneDot status={m.status} />
                      <span>
                        {m.label}
                        {m.date ? <span className="text-white/35"> · {m.date}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {benchmark.stakeholders?.length ? (
              <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  Stakeholders ({benchmark.stakeholders.length})
                </div>
                <ul className="mt-1 space-y-0.5">
                  {benchmark.stakeholders.map((s) => (
                    <li key={s.name} className="text-[10px] text-white/60">
                      <span className="font-medium text-white/80">{s.name}</span>
                      <span className="text-white/40"> — {s.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {benchmark.matching?.length ? (
              <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  Matching patterns
                </div>
                <ul className="mt-1 space-y-0.5">
                  {benchmark.matching.map((m) => (
                    <li key={m.pattern} className="text-[10px] text-white/60">
                      <span className="text-amber-200/80">{m.pattern}</span>
                      {m.scale ? <span className="text-white/40"> · {m.scale}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {benchmark.dataNote ? (
              <p className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/55">
                <span className="text-sky-300/80">Data / OSM: </span>
                {benchmark.dataNote}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={benchmark.sourceUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-300 hover:text-sky-200"
              >
                Source: {benchmark.sourceLabel} ↗
              </a>
              {onShowOnMap ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowOnMap();
                  }}
                  className="rounded bg-violet-500/25 px-2 py-0.5 text-[10px] font-medium text-violet-100 hover:bg-violet-500/35"
                  data-testid={`benchmark-map-${benchmark.id}`}
                >
                  Show on map
                </button>
              ) : null}
            </div>
          </div>
      ) : null}
    </li>
  );
}

function MilestoneDot({ status }: { status?: "done" | "active" | "planned" }) {
  const color =
    status === "done" ? "#34d399" : status === "active" ? "#38bdf8" : status === "planned" ? "#a78bfa" : "#ffffff40";
  return (
    <span
      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}
