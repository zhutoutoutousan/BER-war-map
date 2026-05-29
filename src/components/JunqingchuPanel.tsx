"use client";

import { useMemo, useState } from "react";
import { OsmQuickLegend } from "@/components/OsmQuickLegend";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { LAND_OPPORTUNITY_LABELS, OSM_INTEL_CATEGORIES } from "@/lib/osm-intel-categories";
import { INFRA_ICON_DEFS, INFRA_POINT_ICON_DEFS, LINE_ONLY_ICON_KEYS } from "@/lib/osm-infra-icons";
import { MITGLIEDER } from "@/data/mitglieder";
import type { OsmIntelCategory } from "@/lib/osm-intel-categories";
import type { BerLandSite } from "@/data/ber-land-sites";
import type { OsmIntelDossierItem } from "@/lib/osm-schoenefeld";

const REF_ID = "BER+-SXF-LAND-2026";

export function JunqingchuPanel() {
  const {
    loading,
    error,
    data,
    visibleCategories,
    berTargetsOnly,
    selectedFeatureId,
    toggleCategory,
    setBerTargetsOnly,
    selectFeature,
    reload
  } = useOsmIntel();
  const [tab, setTab] = useState<"land" | "infra">("land");
  const [search, setSearch] = useState("");

  const landParcels = useMemo(() => {
    const list = data?.summary.landParcels ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.landuse.includes(q) ||
        p.notes.toLowerCase().includes(q)
    );
  }, [data, search]);

  const infraTargets = useMemo(() => {
    const list = data?.summary.infrastructure ?? data?.summary.topTargets ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subcategory.toLowerCase().includes(q)
    );
  }, [data, search]);

  const fetchedLabel = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
    : "—";

  return (
    <div className="junqingchu-panel flex flex-col gap-3" data-testid="panel-osm-intel">
      <header className="junqingchu-header relative overflow-hidden rounded-lg border border-red-900/50 px-3 py-2.5">
        <div className="junqingchu-stamp absolute -right-1 top-1 rotate-[-12deg] text-[10px] font-bold tracking-widest text-red-500/70">
          OSM INTEL
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/90">
          Schönefeld · BER+ Land & Infra
        </div>
        <div className="mt-0.5 text-xs text-red-100/90">OpenStreetMap land & corridor infrastructure</div>
        <div className="mt-1 font-mono text-[9px] text-white/45">
          REF {REF_ID} · UPD {fetchedLabel}
        </div>
      </header>

      {loading ? (
        <div className="py-6 text-center font-mono text-xs text-red-200/60">Loading Schönefeld OSM…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
          <button type="button" onClick={() => reload()} className="mt-2 block text-[10px] underline">
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          <OsmQuickLegend compact />

          <p className="text-[11px] leading-relaxed text-white/60">{data.summary.infrastructureNote}</p>
          <p className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-100/85">
            OSM is indicative only — not cadastral / B-Plan. Confirm ownership, grid capacity, and SEGRO/FBB
            leases before any Pilot-1 commitment.
          </p>

          <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            <TabBtn active={tab === "land"} onClick={() => setTab("land")}>
              Land
            </TabBtn>
            <TabBtn active={tab === "infra"} onClick={() => setTab("infra")} testId="osm-tab-infra">
              Infrastructure
            </TabBtn>
          </div>

          {tab === "land" ? (
            <>
              <section className="junqingchu-section">
                <SectionTitle title="BER+ land anchors" />
                <ul className="space-y-2">
                  {data.curatedSites.map((site) => (
                    <CuratedSiteCard
                      key={site.id}
                      site={site}
                      selected={selectedFeatureId === `curated/${site.id}`}
                      onSelect={() =>
                        selectFeature(selectedFeatureId === `curated/${site.id}` ? null : `curated/${site.id}`)
                      }
                    />
                  ))}
                </ul>
              </section>

              <section className="junqingchu-section">
                <SectionTitle title="OSM land parcels" />
                <div className="mb-2 flex gap-2 text-[10px] text-white/50">
                  <span>
                    <span className="font-mono text-emerald-300">{landParcels.length}</span> parcels
                  </span>
                  <span>·</span>
                  <span>
                    ~<span className="font-mono text-emerald-300">{data.summary.developableHa}</span> ha
                    developable (OSM)
                  </span>
                </div>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter parcels…"
                  className="mb-2 w-full rounded border border-emerald-900/40 bg-black/50 px-2 py-1 font-mono text-[11px] text-white"
                />
                <ul className="war-room-scroll max-h-36 space-y-0.5 overflow-y-auto">
                  {landParcels.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectFeature(selectedFeatureId === p.id ? null : p.id)}
                        className={`w-full rounded px-2 py-1 text-left text-[10px] ${
                          selectedFeatureId === p.id
                            ? "bg-emerald-950/50 text-emerald-100 ring-1 ring-emerald-500/40"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-1 font-mono text-white/40">
                          {p.areaHa} ha · {LAND_OPPORTUNITY_LABELS[p.opportunity]?.en ?? p.opportunity} · ★
                          {p.suitability}
                        </span>
                        <div className="text-white/40">{p.notes}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <>
              <section className="junqingchu-section">
                <SectionTitle title="Member-linked OSM" />
                <p className="mb-2 text-[10px] text-white/50">
                  Gold fill / dashed outline = OSM linked to a BER+ member (name, land anchor, corridor proximity).
                </p>
                <ul className="grid grid-cols-2 gap-1 text-[10px]">
                  {MITGLIEDER.map((m) => {
                    const n = data.summary.memberLinkCounts[m.id] ?? 0;
                    return (
                      <li
                        key={m.id}
                        className={`rounded px-2 py-1 ${n > 0 ? "bg-amber-500/15 text-amber-100" : "text-white/35"}`}
                      >
                        <span className="font-medium">{m.shortName}</span>
                        <span className="ml-1 font-mono text-white/50">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="junqingchu-section">
                <SectionTitle title="Symbology" />
                <div className="mb-2 space-y-2">
                  <div>
                    <div className="mb-1 text-[9px] font-semibold uppercase text-white/40">Point markers</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/70">
                      {INFRA_POINT_ICON_DEFS.map((def) => (
                        <span key={def.key} style={{ color: def.color }}>
                          <span className="mr-0.5 text-sm">{def.glyph}</span>
                          {def.labelEn}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[9px] font-semibold uppercase text-white/40">Corridor lines</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/70">
                      {INFRA_ICON_DEFS.filter((d) => d.lineOnly).map((def) => (
                        <span key={def.key} className="inline-flex items-center gap-1">
                          <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: def.color }} />
                          {def.labelEn}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[9px] text-white/40">
                  {data.iconGeojson?.features.length ?? 0} map markers ·{" "}
                  {(data.summary.byCategory.power ?? 0) +
                    (data.summary.byCategory.transport ?? 0) +
                    (data.summary.byCategory.industry ?? 0) +
                    (data.summary.byCategory.aeroway ?? 0) +
                    (data.summary.byCategory.utilities ?? 0)}{" "}
                  infra features (lines + areas)
                </div>
              </section>

              <section className="junqingchu-section">
                <SectionTitle title="Layers" />
                <div className="flex flex-wrap gap-1">
                  {OSM_INTEL_CATEGORIES.filter((c) => c.id !== "land").map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`rounded border px-2 py-0.5 text-[10px] ${
                        visibleCategories[cat.id]
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-white/5 text-white/40"
                      }`}
                    >
                      {cat.labelEn}
                    </button>
                  ))}
                </div>
                <label className="mt-2 flex items-center gap-2 text-[10px] text-white/55">
                  <input
                    type="checkbox"
                    checked={berTargetsOnly}
                    onChange={(e) => setBerTargetsOnly(e.target.checked)}
                    className="accent-red-500"
                  />
                  BER+ keyword highlights only
                </label>
              </section>

              <section className="junqingchu-section">
                <SectionTitle title="Infrastructure register" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="mb-2 w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white"
                />
                <ul className="war-room-scroll max-h-40 space-y-0.5 overflow-y-auto">
                  {infraTargets.map((t) => (
                    <InfraListRow
                      key={t.id}
                      item={t}
                      selected={selectedFeatureId === t.id}
                      onSelect={() => selectFeature(selectedFeatureId === t.id ? null : t.id)}
                    />
                  ))}
                </ul>
              </section>
            </>
          )}

          <LayerToggles
            visible={visibleCategories}
            onToggle={toggleCategory}
            showLand={tab === "land"}
          />

          <p className="font-mono text-[9px] text-white/35">{data.attribution}</p>
        </>
      ) : null}
    </div>
  );
}

function InfraListRow({
  item,
  selected,
  onSelect
}: {
  item: OsmIntelDossierItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLine = item.geomType === "line" || LINE_ONLY_ICON_KEYS.has(item.iconKey);
  const def = INFRA_ICON_DEFS.find((d) => d.key === item.iconKey);

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-start gap-1.5 rounded px-2 py-1 text-left text-[10px] ${
          selected ? "bg-red-950/50 text-red-100" : "text-white/65 hover:bg-white/5"
        }`}
      >
        {isLine ? (
          <span
            className="mt-1.5 inline-block h-0.5 w-3 shrink-0 rounded"
            style={{ backgroundColor: def?.color ?? "#a3e635" }}
            title="Line geometry"
          />
        ) : (
          <span className="shrink-0 text-sm leading-none" style={{ color: def?.color ?? "#94a3b8" }} aria-hidden>
            {item.iconGlyph}
          </span>
        )}
        <span className="min-w-0 flex-1">
          {item.name}
          <span className="text-white/35"> · {item.subcategory}</span>
          {item.memberLabels ? (
            <span className="block text-[9px] text-amber-300/70">{item.memberLabels}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  testId
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
        active ? "bg-white/12 text-white" : "text-white/55"
      }`}
    >
      {children}
    </button>
  );
}

function CuratedSiteCard({
  site,
  selected,
  onSelect
}: {
  site: BerLandSite;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-lg border px-2 py-2 text-left text-[11px] ${
          selected
            ? "border-emerald-500/50 bg-emerald-950/40"
            : "border-white/10 bg-black/30 hover:border-emerald-500/30"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-white">{site.name}</span>
          <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-px font-mono text-[9px] text-emerald-200">
            {site.areaHa} ha
          </span>
        </div>
        <div className="mt-1 text-[10px] text-emerald-200/80">{site.useCase}</div>
        <div className="mt-1 text-white/50">{site.berPlusRole}</div>
        <div className="mt-1 text-[9px] italic text-white/40">{site.notes}</div>
      </button>
    </li>
  );
}

function LayerToggles({
  visible,
  onToggle,
  showLand
}: {
  visible: Record<OsmIntelCategory, boolean>;
  onToggle: (id: OsmIntelCategory) => void;
  showLand: boolean;
}) {
  const cats = showLand
    ? OSM_INTEL_CATEGORIES.filter((c) => c.id === "land")
    : OSM_INTEL_CATEGORIES;
  return (
    <div className="flex flex-wrap gap-1">
      {cats.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onToggle(cat.id)}
          className={`rounded px-2 py-0.5 text-[10px] ${
            visible[cat.id] ? "text-white" : "text-white/40"
          }`}
          style={
            visible[cat.id]
              ? { background: `${cat.color}33`, border: `1px solid ${cat.color}66` }
              : { background: "rgba(255,255,255,0.05)" }
          }
        >
          Map: {cat.labelEn}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-1.5 border-b border-red-900/25 pb-1">
      <span className="text-[11px] font-bold text-red-300/95">{title}</span>
    </div>
  );
}
