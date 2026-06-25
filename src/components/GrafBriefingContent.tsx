"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import { GRAF_BRIEFING, type GrafCrossrefPayload } from "@/lib/graf-briefing";
import { GrafEmployerMap } from "@/components/GrafEmployerMap";

function Kpi({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-white/70">{label}</div>
      {hint ? <div className="mt-1 text-[10px] text-white/45">{hint}</div> : null}
    </div>
  );
}

function confBadge(c: string) {
  const base = "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase";
  if (c === "predicted") return `${base} bg-amber-400/15 text-amber-200`;
  if (c === "registry" || c === "member_cited") return `${base} bg-emerald-400/15 text-emerald-200`;
  if (c === "wikidata" || c === "press") return `${base} bg-sky-400/15 text-sky-200`;
  return `${base} bg-white/10 text-white/50`;
}

export function GrafBriefingContent() {
  const [data, setData] = useState<GrafCrossrefPayload | null>(null);
  const [filter, setFilter] = useState("");
  const [onlyWithData, setOnlyWithData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/graf/employee-crossref.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Briefing data missing — run: node scripts/sync-graf-briefing-data.mjs"));
  }, []);

  const named = useMemo(
    () => (data?.records ?? []).filter((r) => r.named),
    [data]
  );

  const mapSites = useMemo(() => named.filter((r) => r.lat != null), [named]);

  const tableRows = useMemo(() => {
    const q = filter.toLowerCase();
    return named
      .filter((r) => {
        if (onlyWithData && !r.employees && !r.employeesRange) return false;
        if (!q) return true;
        return `${r.name} ${r.landuse} ${r.source ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.employees ?? 0) - (a.employees ?? 0) || a.name.localeCompare(b.name));
  }, [named, filter, onlyWithData]);

  const s = data?.summary;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-4 py-5" data-testid="graf-briefing-page">
      <header className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300/90">
            Stakeholder signal · {GRAF_BRIEFING.attribution.signal}
          </div>
          <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">{GRAF_BRIEFING.title}</h1>
          <p className="mt-1 text-sm text-white/65">{GRAF_BRIEFING.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
            ← {BRAND.shortName} map
          </Link>
          <Link href="/briefing" className="rounded-lg bg-sky-400/15 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-400/20">
            Resilience briefing
          </Link>
        </div>
      </header>

      {error ? (
        <div className="panel border border-amber-500/30 p-4 text-sm text-amber-100">{error}</div>
      ) : null}

      <section className="panel p-4" data-section="hero">
        <blockquote className="border-l-2 border-amber-400/80 pl-4 text-sm italic text-white/85 md:text-base">
          {GRAF_BRIEFING.quote}
        </blockquote>
        <cite className="mt-2 block text-xs not-italic text-white/50">
          {GRAF_BRIEFING.attribution.context} · {GRAF_BRIEFING.attribution.project}
        </cite>
      </section>

      <section className="grid gap-3 md:grid-cols-2" data-section="reframe">
        <div className="panel border border-red-400/20 p-4">
          <div className="text-[10px] font-bold uppercase text-red-300">Not primarily</div>
          <p className="mt-2 text-sm text-white/75">{GRAF_BRIEFING.reframe.not}</p>
        </div>
        <div className="panel border border-emerald-400/25 p-4">
          <div className="text-[10px] font-bold uppercase text-emerald-300">Rather — Beschäftigungstiefe</div>
          <p className="mt-2 text-sm text-white/75">{GRAF_BRIEFING.reframe.rather}</p>
        </div>
      </section>

      <section data-section="evidence">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-300/90">Evidence dashboard</div>
        {s ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4" data-testid="graf-kpi-grid">
            <Kpi value="~800" label="BB Business Hub employees" hint="Alpine member news · ~50 firms" />
            <Kpi value={s.namedSites} label="Named employers (OSM)" hint="Schönefeld bbox" />
            <Kpi value={s.predictedSites} label="Modelled sites" hint={`Σ ~${s.sumPredictedEmployees.toLocaleString()}`} />
            <Kpi
              value={s.sumCorridorIndicative ? `~${Math.round(s.sumCorridorIndicative / 1000)}k` : "—"}
              label="Corridor indicative Σ"
              hint="Site + modelled · excl. corporate HQ"
            />
          </div>
        ) : (
          <div className="text-sm text-white/50">Loading…</div>
        )}
      </section>

      <section className="panel overflow-hidden p-0" data-section="map">
        <div className="border-b border-white/10 px-4 py-2 text-xs text-white/55">
          Live OSM gewerbe layer · gold = modelled · green = matched count
        </div>
        {mapSites.length > 0 ? <GrafEmployerMap sites={mapSites} /> : <div className="p-8 text-center text-white/50">Loading map…</div>}
      </section>

      <section className="panel p-4" data-section="model">
        <h2 className="text-sm font-semibold text-white">Corridor employment model</h2>
        <p className="mt-1 text-xs text-white/55">Three-step logic for sites without public headcount — transparent, not a black box.</p>
        <ol className="mt-3 space-y-3">
          {GRAF_BRIEFING.modelSteps.map((step, i) => (
            <li key={step.title} className="rounded-lg bg-white/[0.03] p-3">
              <span className="text-[10px] font-bold text-sky-300">0{i + 1}</span>
              <div className="mt-1 text-sm font-medium text-white">{step.title}</div>
              <p className="mt-1 text-xs text-white/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section data-section="table">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Employer cross-reference</h2>
          <input
            type="search"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white"
          />
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" checked={onlyWithData} onChange={(e) => setOnlyWithData(e.target.checked)} />
            Only with employee data
          </label>
          <span className="text-xs text-white/45">{tableRows.length} rows</span>
        </div>
        <div className="panel max-h-[min(420px,50vh)] overflow-auto p-0">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-ink-900/95 text-[10px] uppercase text-white/45">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Employees</th>
                <th className="px-3 py-2">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white/90">{r.name}</td>
                  <td className="px-3 py-2 text-white/55">{r.landuse}</td>
                  <td className="px-3 py-2 font-medium text-emerald-200/90">
                    {r.employees != null ? `~${r.employees.toLocaleString()}${r.confidence === "predicted" ? " †" : ""}` : r.employeesRange ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className={confBadge(r.confidence)}>{r.confidence}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-amber-200/80">† predicted · * corporate group figures not shown in table</p>
      </section>

      <section className="panel border border-sky-500/20 bg-sky-950/20 p-4" data-section="pilot">
        <div className="text-xs font-semibold uppercase text-sky-200">90-day pilot proposal</div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {GRAF_BRIEFING.pilot.steps.map((step, i) => (
            <div key={step.title} className="rounded-lg bg-black/25 p-3">
              <div className="text-[10px] font-bold text-sky-300">0{i + 1}</div>
              <div className="mt-1 text-sm font-medium text-white">{step.title}</div>
              <p className="mt-1 text-xs text-white/60">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {GRAF_BRIEFING.pilot.anchors.map((a) => (
            <span key={a} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
              {a}
            </span>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-white/45">{GRAF_BRIEFING.disclaimer}</p>
    </div>
  );
}
