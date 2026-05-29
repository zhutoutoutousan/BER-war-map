"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  buildCorridorGraph,
  graphHighlightForMember
} from "@/lib/member-asset-graph";
import type { LiveMatch } from "@/lib/local-member-matching";
import { MatchingGraphCanvas, MatchingGraphLegend } from "@/components/MatchingGraphCanvas";

type Props = {
  memberId: string | null;
  osmMatches?: LiveMatch[];
  onSelectNode?: (nodeId: string) => void;
  onOpenGiantMap?: () => void;
};

export function CorridorPanoramaGraph({
  memberId,
  osmMatches = [],
  onSelectNode,
  onOpenGiantMap
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const baseGraph = useMemo(() => buildCorridorGraph(), []);

  const graph = useMemo(() => {
    const nodes = [...baseGraph.nodes];
    const edges = [...baseGraph.edges];
    let nextX = 400;
    for (const m of osmMatches) {
      if (!m.center || !m.osmFeatureId) continue;
      const id = `osm-${m.osmFeatureId}`;
      if (nodes.some((n) => n.id === id)) continue;
      nodes.push({
        id,
        kind: "osm",
        label: m.title.slice(0, 28),
        sublabel: m.detail.slice(0, 40),
        x: nextX,
        y: 180,
        color: "#fbbf24",
        memberIds: memberId ? [memberId] : [],
        osmFeatureId: m.osmFeatureId
      });
      if (memberId) {
        edges.push({
          id: `osm-link-${m.osmFeatureId}`,
          from: `member-${memberId}`,
          to: id,
          label: "OSM match",
          memberIds: [memberId]
        });
      }
      nextX += 140;
    }
    return { ...baseGraph, nodes, edges };
  }, [baseGraph, osmMatches, memberId]);

  const highlight = useMemo(() => graphHighlightForMember(graph, memberId), [graph, memberId]);

  useEffect(() => {
    if (!memberId || !scrollRef.current) return;
    const memberNode = graph.nodes.find((n) => n.id === `member-${memberId}`);
    if (!memberNode) return;
    const el = scrollRef.current.querySelector("[data-testid=matching-graph-canvas]");
    if (!el) return;
    const target = Math.max(0, memberNode.x - el.clientWidth / 2);
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [memberId, graph.nodes]);

  return (
    <div
      className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-ink-950/80 to-black/60 p-3"
      data-testid="corridor-panorama-graph"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-200/90">
            Corridor scroll map
          </div>
          <p className="text-[11px] text-white/50">
            Scroll → airport · land · members · your OSM links
          </p>
        </div>
        <div className="flex items-center gap-2">
          {memberId ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
              {highlight.edgeIds.size} links
            </span>
          ) : null}
          {onOpenGiantMap ? (
            <button
              type="button"
              onClick={onOpenGiantMap}
              className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-medium text-amber-100 hover:bg-amber-500/35"
              data-testid="open-giant-matching-map"
            >
              Giant map ↗
            </button>
          ) : null}
        </div>
      </div>

      <div ref={scrollRef}>
        <MatchingGraphCanvas
          graph={graph}
          highlightMemberId={memberId}
          highlight={highlight}
          onSelectNode={onSelectNode}
          height={320}
          gradientIdPrefix="panel"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <MatchingGraphLegend />
        <span className="text-[10px] text-white/40">← scroll · click node</span>
      </div>
    </div>
  );
}
