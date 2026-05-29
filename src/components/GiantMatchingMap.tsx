"use client";

import { useCallback, useEffect, useMemo, startTransition, useState } from "react";
import { useOsmIntel } from "@/context/OsmIntelContext";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getMitgliedById,
  MITGLIEDER,
  type MemberCategory
} from "@/data/mitglieder";
import {
  buildGiantMatchingGraph,
  buildOsmLinksFromGeojson,
  egoGraphForMember,
  graphHighlightForMember,
  overviewGraphWithoutOsm,
  corridorOsmPreview,
  type CorridorGraph
} from "@/lib/member-asset-graph";
import { MatchingGraphCanvas, MatchingGraphLegend } from "@/components/MatchingGraphCanvas";
import { MatchingSwipeDeck } from "@/components/MatchingSwipeDeck";
import { mgTrace, mgTraceBegin } from "@/lib/matching-graph-trace";
import type { LiveMatch } from "@/lib/local-member-matching";
import { savedCount as loadSavedCount } from "@/lib/matching-swipe-store";
import { useIsMobile } from "@/lib/use-media";

export type WorkspaceViewMode = "geo" | "matching";
export type MatchingScope = "all" | "focus";
export type MatchingPanel = "map" | "swipe";

type Props = {
  /** Suggested focus when opening (e.g. logged-in member) */
  defaultMemberId?: string | null;
  onSelectNode: (nodeId: string) => void;
  onSwitchToGeo: () => void;
};

export function GiantMatchingMap({ defaultMemberId, onSelectNode, onSwitchToGeo }: Props) {
  const { data, loading } = useOsmIntel();
  const isMobile = useIsMobile();
  const [scope, setScope] = useState<MatchingScope>("focus");
  const [focusMemberId, setFocusMemberId] = useState<string | null>(
    defaultMemberId ?? MITGLIEDER[0]?.id ?? null
  );
  const [categoryFilter, setCategoryFilter] = useState<MemberCategory | "all">("all");
  const [layerLand, setLayerLand] = useState(true);
  const [layerOsm, setLayerOsm] = useState(true);
  const [layerInfra, setLayerInfra] = useState(true);
  const [osmOverview, setOsmOverview] = useState(false);
  const [panel, setPanel] = useState<MatchingPanel>("map");
  const [savedMatches, setSavedMatches] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setToolsOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && defaultMemberId && scope === "focus") {
      setPanel("swipe");
    }
  }, [isMobile, defaultMemberId, scope]);

  const highlightMemberId = scope === "focus" ? focusMemberId : null;

  useEffect(() => {
    if (focusMemberId) setSavedMatches(loadSavedCount(focusMemberId));
  }, [focusMemberId, panel]);

  const osmLinks = useMemo(
    () => {
      const end = mgTraceBegin("graph", "buildOsmLinksFromGeojson");
      const links = buildOsmLinksFromGeojson(data?.geojson ?? null, {
        allMemberLinked: true,
        includeCorridor: true,
        corridorMax: 36
      });
      end();
      mgTrace("graph", "osm links", { count: links.length });
      return links;
    },
    [data?.geojson]
  );

  const [baseGraph, setBaseGraph] = useState<CorridorGraph | null>(null);
  const [graphBuilding, setGraphBuilding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGraphBuilding(true);
    mgTrace("graph", "schedule buildGiantMatchingGraph", { links: osmLinks.length });

    const run = () => {
      if (cancelled) return;
      const end = mgTraceBegin("graph", "buildGiantMatchingGraph");
      const g = buildGiantMatchingGraph(osmLinks);
      end();
      mgTrace("graph", "base ready", {
        nodes: g.nodes.length,
        edges: g.edges.length,
        osmLinks: osmLinks.length
      });
      startTransition(() => {
        if (!cancelled) {
          setBaseGraph(g);
          setGraphBuilding(false);
        }
      });
    };

    let handle: number;
    if (typeof requestIdleCallback !== "undefined") {
      handle = requestIdleCallback(run, { timeout: 150 });
    } else {
      handle = window.setTimeout(run, 0);
    }

    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, [osmLinks]);

  const graph = useMemo(() => {
    if (!baseGraph) {
      return { width: 5200, height: 1500, nodes: [] as CorridorGraph["nodes"], edges: [] as CorridorGraph["edges"] };
    }
    const end = mgTraceBegin("graph", "filterLayers");
    let nodes = baseGraph.nodes.filter((n) => {
      if (n.kind === "land" && !layerLand) return false;
      if (n.kind === "osm" && !layerOsm) return false;
      if (n.kind === "infra" && !layerInfra && !n.id.startsWith("zone-")) return false;
      if (n.kind === "member" && categoryFilter !== "all") {
        const id = n.id.replace("member-", "");
        const m = getMitgliedById(id);
        return m?.category === categoryFilter;
      }
      return true;
    });

    if (categoryFilter !== "all") {
      const ids = new Set(nodes.map((n) => n.id));
      const linked = new Set<string>();
      for (const e of baseGraph.edges) {
        if (ids.has(e.from)) linked.add(e.to);
        if (ids.has(e.to)) linked.add(e.from);
      }
      nodes = nodes.filter((n) => {
        if (n.kind !== "land" && n.kind !== "osm" && n.kind !== "airport") return true;
        return linked.has(n.id);
      });
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    let edges = baseGraph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

    let out: CorridorGraph = { ...baseGraph, nodes, edges };

    if (scope === "focus" && focusMemberId) {
      out = egoGraphForMember(out, focusMemberId, { maxOsm: layerOsm ? 72 : 0 });
    } else if (!layerOsm || !osmOverview) {
      out = overviewGraphWithoutOsm(out);
    } else {
      out = corridorOsmPreview(out, 48);
    }

    end();
    mgTrace("graph", "filtered", {
      nodes: out.nodes.length,
      edges: out.edges.length,
      scope,
      focus: focusMemberId,
      categoryFilter,
      layers: { land: layerLand, osm: layerOsm, infra: layerInfra, osmOverview }
    });
    return out;
  }, [baseGraph, categoryFilter, layerLand, layerOsm, layerInfra, scope, focusMemberId, osmOverview]);

  const highlight = useMemo(() => {
    const end = mgTraceBegin("highlight", "graphHighlightForMember");
    const h = graphHighlightForMember(graph, highlightMemberId);
    end();
    if (highlightMemberId) {
      mgTrace("highlight", "member sets", {
        memberId: highlightMemberId,
        nodes: h.nodeIds.size,
        edges: h.edgeIds.size
      });
    }
    return h;
  }, [graph, highlightMemberId]);

  const stats = useMemo(() => {
    const totalOsm = baseGraph?.nodes.filter((n) => n.kind === "osm").length ?? 0;
    return {
      members: graph.nodes.filter((n) => n.kind === "member").length,
      osm: graph.nodes.filter((n) => n.kind === "osm").length,
      osmTotal: totalOsm,
      land: graph.nodes.filter((n) => n.kind === "land").length,
      edges: graph.edges.length
    };
  }, [graph, baseGraph]);

  const focusMember = focusMemberId ? getMitgliedById(focusMemberId) : null;

  const showAll = useCallback(() => {
    setScope("all");
    setOsmOverview(false);
  }, []);

  const focusOnMember = useCallback((memberId: string) => {
    mgTrace("click", "focusMember", { memberId, prev: focusMemberId, scope });
    startTransition(() => {
      setFocusMemberId(memberId);
      setScope("focus");
      setOsmOverview(false);
    });
  }, [focusMemberId, scope]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      mgTrace("click", "node", { nodeId, scope, focusMemberId });
      if (nodeId.startsWith("member-")) {
        focusOnMember(nodeId.replace("member-", ""));
        return;
      }
      onSelectNode(nodeId);
    },
    [focusOnMember, onSelectNode, scope, focusMemberId]
  );

  const handleSwipeMatchOpen = useCallback(
    (match: LiveMatch) => {
      if (match.osmFeatureId) onSelectNode(`osm-${match.osmFeatureId}`);
      else if (match.landSiteId) onSelectNode(`land-${match.landSiteId}`);
      else if (match.peerMemberId) onSelectNode(`member-${match.peerMemberId}`);
      onSwitchToGeo();
    },
    [onSelectNode, onSwitchToGeo]
  );

  const fitMode: MatchingScope = scope;

  const fitRevision = useMemo(
    () =>
      `${scope}|${focusMemberId ?? ""}|${osmOverview}|${categoryFilter}|${layerLand}|${layerOsm}|${layerInfra}|${graph.nodes.length}|${graph.edges.length}`,
    [scope, focusMemberId, osmOverview, categoryFilter, layerLand, layerOsm, layerInfra, graph.nodes.length, graph.edges.length]
  );

  return (
    <div
      className="absolute inset-0 z-[2] flex flex-col bg-ink-950 pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0"
      data-testid="giant-matching-map"
      data-scene={`matching:${scope}${focusMemberId ? `:${focusMemberId}` : ""}`}
    >
      <div className="shrink-0 border-b border-white/10 bg-ink-900/90 px-3 py-2 backdrop-blur-md safe-top sm:px-4 sm:py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/90">
              Matching map
            </div>
            <h2 className="truncate text-sm font-semibold text-white sm:text-base">
              {scope === "focus" && focusMember
                ? `${focusMember.shortName} · corridor network`
                : "Corridor overview"}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-white/50 sm:line-clamp-none">
              {scope === "focus" && focusMember
                ? `${stats.osm} OSM · ${stats.land} land · ${stats.edges} links`
                : `${stats.members} members · ${stats.land} land`}
              {loading ? " · loading OSM…" : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <ScopeToggle scope={scope} onAll={showAll} onFocus={() => focusMemberId && setScope("focus")} />
            {scope === "focus" && focusMemberId ? (
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "map" ? "swipe" : "map"))}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-medium touch-manipulation ${
                  panel === "swipe"
                    ? "bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/40"
                    : "bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                }`}
                data-testid="matching-swipe-toggle"
              >
                {panel === "swipe" ? "Map" : `Review${savedMatches ? ` (${savedMatches})` : ""}`}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setToolsOpen((o) => !o)}
              className="min-h-[44px] rounded-lg bg-white/8 px-3 py-2 text-xs font-medium text-white/70 touch-manipulation md:hidden"
              aria-expanded={toolsOpen}
            >
              {toolsOpen ? "Less" : "Filters"}
            </button>
            <button
              type="button"
              onClick={onSwitchToGeo}
              className="min-h-[44px] rounded-lg bg-sky-500/20 px-3 py-2 text-xs font-medium text-sky-100 touch-manipulation hover:bg-sky-500/35 max-md:hidden"
              data-testid="switch-to-geo-map"
            >
              ← Geo map
            </button>
          </div>
        </div>

        <div className={`mt-2 space-y-2 ${isMobile && !toolsOpen ? "hidden" : ""} md:block`}>
        <div className="flex flex-wrap items-center gap-2">
          <MatchingGraphLegend giant />
          <span className="hidden text-white/20 sm:inline">|</span>
          <LayerToggle label="Land" on={layerLand} onChange={setLayerLand} />
          <LayerToggle label="OSM" on={layerOsm} onChange={setLayerOsm} />
          <LayerToggle label="Infra" on={layerInfra} onChange={setLayerInfra} />
          {scope === "all" ? (
            <LayerToggle
              label="OSM detail"
              on={osmOverview}
              onChange={setOsmOverview}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1">
          <FilterChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            label="All categories"
          />
          {(Object.keys(CATEGORY_LABELS) as MemberCategory[]).map((cat) => (
            <FilterChip
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              label={CATEGORY_LABELS[cat].split(" / ")[0]}
              color={CATEGORY_COLORS[cat]}
            />
          ))}
        </div>

        <div className="war-room-scroll flex max-w-full gap-1 overflow-x-auto pb-1">
          <FilterChip active={scope === "all"} onClick={showAll} label="Overview" />
          {MITGLIEDER.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => focusOnMember(m.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] touch-manipulation ${
                scope === "focus" && focusMemberId === m.id
                  ? "bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40"
                  : "bg-white/8 text-white/55 hover:bg-white/12"
              }`}
            >
              {m.shortName}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 touch-pan-x touch-pan-y p-1 sm:p-3">
        {panel === "swipe" && focusMemberId ? (
          <MatchingSwipeDeck
            memberId={focusMemberId}
            onClose={() => setPanel("map")}
            onSavedChange={setSavedMatches}
            onSelectMatch={handleSwipeMatchOpen}
          />
        ) : graphBuilding || !baseGraph ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-amber-500/20 bg-ink-950/90">
            <p className="text-sm text-white/55">Building matching graph…</p>
          </div>
        ) : (
          <MatchingGraphCanvas
            graph={graph}
            highlightMemberId={highlightMemberId}
            highlight={highlight}
            onSelectNode={handleNodeClick}
            height="fill"
            className="h-full border-amber-500/20"
            gradientIdPrefix="giant"
            enableZoom
            fitMode={fitMode}
            fitRevision={fitRevision}
          />
        )}
        {panel === "map" ? (
        <p className="pointer-events-none absolute bottom-2 left-1/2 hidden max-w-[90%] -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-center text-[10px] text-white/45 sm:block">
          {scope === "focus"
            ? "Focus layout · Review for swipe queue"
            : "Overview · pick a Mitglied chip"}
        </p>
        ) : null}
      </div>

      {scope === "focus" && focusMember && panel === "map" ? (
        <div className="shrink-0 border-t border-white/10 bg-ink-900/80 px-3 py-2 text-[11px] text-white/60 sm:px-4">
          <span className="font-medium text-white/85">{focusMember.shortName}</span>
          {" · "}
          {CATEGORY_LABELS[focusMember.category]}
          {" · "}
          {highlight.edgeIds.size} links · {savedMatches} saved matches
          {" · "}
          <button type="button" onClick={() => setPanel("swipe")} className="text-emerald-300 hover:underline">
            Review queue
          </button>
          {" · "}
          <button type="button" onClick={showAll} className="text-sky-300 hover:underline">
            Corridor overview
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ScopeToggle({
  scope,
  onAll,
  onFocus
}: {
  scope: MatchingScope;
  onAll: () => void;
  onFocus: () => void;
}) {
  return (
    <div className="flex rounded-lg bg-white/8 p-0.5" data-testid="matching-scope-toggle">
      <button
        type="button"
        onClick={onAll}
        className={`min-h-[36px] rounded-md px-3 py-1.5 text-[11px] font-medium touch-manipulation ${
          scope === "all" ? "bg-amber-500/30 text-amber-100" : "text-white/55 hover:text-white/75"
        }`}
      >
        Overview
      </button>
      <button
        type="button"
        onClick={onFocus}
        className={`min-h-[36px] rounded-md px-3 py-1.5 text-[11px] font-medium touch-manipulation ${
          scope === "focus" ? "bg-emerald-500/30 text-emerald-100" : "text-white/55 hover:text-white/75"
        }`}
      >
        Member
      </button>
    </div>
  );
}

function LayerToggle({
  label,
  on,
  onChange
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`min-h-[36px] rounded-full px-3 py-1.5 text-[11px] touch-manipulation ${
        on ? "bg-white/12 text-white/80" : "bg-white/5 text-white/35 line-through"
      }`}
    >
      {label}
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] rounded-full px-3 py-1.5 text-[11px] touch-manipulation ${
        active ? "ring-1 ring-white/25 bg-white/12 text-white" : "bg-white/8 text-white/55 hover:bg-white/12"
      }`}
    >
      {color ? (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
      {label}
    </button>
  );
}
