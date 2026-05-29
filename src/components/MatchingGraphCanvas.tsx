"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CorridorGraph, GraphEdge, GraphNode, GraphViewport } from "@/lib/member-asset-graph";
import {
  graphFullViewport,
  graphViewportForNodes,
  normalizeViewport,
  panViewport,
  viewportToViewBox,
  zoomViewport
} from "@/lib/member-asset-graph";
import { cullGraphView, type GraphDetailLevel } from "@/lib/graph-view-cull";
import { isRawOsmRef } from "@/lib/osm-display-name";
import { MatchingGraphRaster } from "@/components/MatchingGraphRaster";

type Props = {
  graph: CorridorGraph;
  highlightMemberId: string | null;
  highlight: { nodeIds: Set<string>; edgeIds: Set<string> };
  onSelectNode?: (nodeId: string) => void;
  height?: number | "fill";
  className?: string;
  gradientIdPrefix?: string;
  enableZoom?: boolean;
  fitMode?: "all" | "focus";
  fitRevision?: string;
};

type CanvasMode = "pan" | "select";

function zoomPercent(full: GraphViewport, current: GraphViewport): number {
  return Math.min(400, Math.max(25, Math.round((full.width / current.width) * 100)));
}

function computeFitViewport(
  graph: CorridorGraph,
  highlight: { nodeIds: Set<string> },
  mode: "all" | "focus",
  highlightMemberId: string | null
): GraphViewport {
  if (mode === "focus" && highlightMemberId) {
    const focusNodes = graph.nodes.filter((n) => highlight.nodeIds.has(n.id));
    if (focusNodes.length) return graphViewportForNodes(focusNodes, graph, 140);
  }
  if (graph.nodes.length) return graphViewportForNodes(graph.nodes, graph, 160);
  return graphFullViewport(graph, 40);
}

export function MatchingGraphCanvas(props: Props) {
  if (props.enableZoom) {
    return (
      <MatchingGraphRaster
        graph={props.graph}
        highlightMemberId={props.highlightMemberId}
        onSelectNode={props.onSelectNode}
        className={props.className}
        fitMode={props.fitMode}
        fitRevision={props.fitRevision}
      />
    );
  }
  return <MatchingGraphSvgCanvas {...props} />;
}

function MatchingGraphSvgCanvas({
  graph,
  highlightMemberId,
  highlight,
  onSelectNode,
  height = 320,
  className = "",
  gradientIdPrefix = "mg",
  enableZoom = false,
  fitMode = "all",
  fitRevision = ""
}: Props) {
  const skyId = `${gradientIdPrefix}-sky`;
  const spineId = `${gradientIdPrefix}-spine`;
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef(graph);
  const highlightRef = useRef(highlight);
  const viewportRef = useRef<GraphViewport>(graphFullViewport(graph, 40));
  const aspectRef = useRef(16 / 9);
  const lastFitKey = useRef("");
  const panRef = useRef<{ x: number; y: number; vp: GraphViewport } | null>(null);
  const rafRef = useRef(0);

  graphRef.current = graph;
  highlightRef.current = highlight;

  const [viewport, setViewport] = useState<GraphViewport>(() =>
    enableZoom ? computeFitViewport(graph, highlight, fitMode, highlightMemberId) : graphFullViewport(graph, 40)
  );
  const [zoomPct, setZoomPct] = useState(100);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("select");
  const [isDragging, setIsDragging] = useState(false);

  viewportRef.current = viewport;

  const fitKey = `${fitMode}|${highlightMemberId ?? ""}|${fitRevision}`;

  const flushViewport = useCallback((vp: GraphViewport) => {
    const g = graphRef.current;
    const next = normalizeViewport(vp, g, aspectRef.current);
    viewportRef.current = next;
    setViewport(next);
    setZoomPct(zoomPercent(graphFullViewport(g, 40), next));
    return next;
  }, []);

  const scheduleViewport = useCallback((vp: GraphViewport) => {
    viewportRef.current = normalizeViewport(vp, graphRef.current, aspectRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const next = viewportRef.current;
      setViewport(next);
      setZoomPct(zoomPercent(graphFullViewport(graphRef.current, 40), next));
    });
  }, []);

  const commitViewport = useCallback(
    (vp: GraphViewport) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return flushViewport(vp);
    },
    [flushViewport]
  );

  const applyFit = useCallback(
    (mode: "all" | "focus", key?: string) => {
      const g = graphRef.current;
      const h = highlightRef.current;
      const vp = computeFitViewport(g, h, mode, highlightMemberId);
      commitViewport(vp);
      if (key !== undefined) lastFitKey.current = key;
    },
    [commitViewport, highlightMemberId]
  );

  useEffect(() => {
    if (!enableZoom) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height: h } = entry.contentRect;
      if (width <= 0 || h <= 0) return;
      aspectRef.current = width / h;
      commitViewport(viewportRef.current);
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) aspectRef.current = rect.width / rect.height;
    return () => ro.disconnect();
  }, [enableZoom, commitViewport]);

  useEffect(() => {
    if (!enableZoom) return;
    if (lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;
    const g = graphRef.current;
    const h = highlightRef.current;
    const vp = computeFitViewport(g, h, fitMode, highlightMemberId);
    commitViewport(vp);
  }, [enableZoom, fitKey, fitMode, highlightMemberId, commitViewport]);

  const zoomBy = useCallback(
    (factor: number) => {
      const v = viewportRef.current;
      const cx = v.x + v.width / 2;
      const cy = v.y + v.height / 2;
      commitViewport(zoomViewport(v, factor, cx, cy));
    },
    [commitViewport]
  );

  useEffect(() => {
    if (!enableZoom) return;
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const v = viewportRef.current;
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const mx = v.x + ((e.clientX - rect.left) / rect.width) * v.width;
      const my = v.y + ((e.clientY - rect.top) / rect.height) * v.height;
      scheduleViewport(zoomViewport(v, factor, mx, my));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [enableZoom, scheduleViewport]);

  useEffect(() => {
    if (!enableZoom) return;

    const onMove = (e: PointerEvent) => {
      const pan = panRef.current;
      if (!pan) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dx = ((e.clientX - pan.x) / rect.width) * pan.vp.width;
      const dy = ((e.clientY - pan.y) / rect.height) * pan.vp.height;
      scheduleViewport(panViewport(pan.vp, -dx, -dy, graphRef.current));
    };

    const endPan = () => {
      panRef.current = null;
      setIsDragging(false);
      commitViewport(viewportRef.current);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endPan);
    window.addEventListener("pointercancel", endPan);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endPan);
      window.removeEventListener("pointercancel", endPan);
    };
  }, [enableZoom, scheduleViewport, commitViewport]);

  const culled = useMemo(
    () =>
      cullGraphView({
        graph,
        viewport,
        zoomPct,
        highlightEdgeIds: highlight.edgeIds,
        highlightNodeIds: highlight.nodeIds,
        enableCulling: enableZoom
      }),
    [graph, viewport, zoomPct, highlight.edgeIds, highlight.nodeIds, enableZoom]
  );

  const renderNodes = enableZoom ? culled.nodes : graph.nodes;
  const renderEdges = enableZoom ? culled.edges : graph.edges;
  const nodeById = enableZoom ? culled.nodeById : new Map(graph.nodes.map((n) => [n.id, n]));
  const detail = enableZoom ? culled.detail : ("full" as GraphDetailLevel);
  const { visibleCount } = culled;

  const startPan = useCallback((clientX: number, clientY: number) => {
    panRef.current = { x: clientX, y: clientY, vp: viewportRef.current };
    setIsDragging(true);
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enableZoom || e.button !== 0) return;
      if (canvasMode === "select" && (e.target as Element).closest("[data-graph-node]")) return;
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      startPan(e.clientX, e.clientY);
    },
    [enableZoom, canvasMode, startPan]
  );

  const containerStyle =
    height === "fill" ? { minHeight: "100%", height: "100%" } : { height };

  const canvasCursor =
    canvasMode === "pan"
      ? isDragging
        ? "grabbing"
        : "grab"
      : isDragging
        ? "grabbing"
        : "default";

  return (
    <div className={`relative ${height === "fill" ? "h-full min-h-0" : ""}`}>
      {enableZoom ? (
        <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-col gap-1">
          <div className="flex gap-1">
            <ModeBtn
              active={canvasMode === "select"}
              onClick={() => setCanvasMode("select")}
              title="Select — click nodes"
              label="↖"
            />
            <ModeBtn
              active={canvasMode === "pan"}
              onClick={() => setCanvasMode("pan")}
              title="Pan — drag canvas"
              label="✥"
            />
          </div>
          <ZoomBtn label="+" onClick={() => zoomBy(0.85)} title="Zoom in" />
          <span className="rounded-md bg-black/70 px-2 py-0.5 text-center text-[10px] text-white/70">
            {zoomPct}%
          </span>
          {visibleCount.nodes < visibleCount.totalNodes ? (
            <span
              className="rounded-md bg-black/60 px-1.5 py-0.5 text-center text-[9px] leading-tight text-white/45"
              title={`Level of detail: ${detail}`}
            >
              {visibleCount.nodes}/{visibleCount.totalNodes}n · {visibleCount.edges}/{visibleCount.totalEdges}e
            </span>
          ) : null}
          <ZoomBtn label="−" onClick={() => zoomBy(1.15)} title="Zoom out" />
          <ZoomBtn
            label="⊡"
            onClick={() => {
              lastFitKey.current = "";
              applyFit("all", fitKey);
            }}
            title="Fit all"
          />
          {highlightMemberId ? (
            <ZoomBtn
              label="◎"
              onClick={() => {
                lastFitKey.current = "";
                applyFit("focus", fitKey);
              }}
              title="Fit focus"
            />
          ) : null}
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={`${enableZoom ? "h-full w-full overflow-hidden" : "war-room-scroll overflow-auto"} rounded-lg border border-white/10 bg-[#060a10] ${className}`}
        style={{ ...containerStyle, cursor: enableZoom ? canvasCursor : undefined }}
        data-testid="matching-graph-canvas"
        data-canvas-mode={enableZoom ? canvasMode : undefined}
      >
        <svg
          width={enableZoom ? "100%" : graph.width}
          height={enableZoom ? "100%" : graph.height}
          viewBox={viewportToViewBox(viewport)}
          preserveAspectRatio="xMidYMid meet"
          shapeRendering={isDragging ? "optimizeSpeed" : "auto"}
          style={
            enableZoom
              ? { display: "block", width: "100%", height: "100%", touchAction: "none" }
              : {
                  width: graph.width,
                  height: graph.height,
                  minWidth: graph.width,
                  minHeight: graph.height,
                  display: "block"
                }
          }
          role="img"
          aria-label="Mitglied and asset matching diagram"
        >
          <defs>
            <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c1929" />
              <stop offset="100%" stopColor="#060a10" />
            </linearGradient>
            <linearGradient id={spineId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf866" />
              <stop offset="50%" stopColor="#10b98188" />
              <stop offset="100%" stopColor="#f59e0b66" />
            </linearGradient>
            {detail === "full" ? (
              <filter id={`${gradientIdPrefix}-glow`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ) : null}
          </defs>

          <rect width={graph.width} height={graph.height} fill={`url(#${skyId})`} />

          <path
            d={`M 80 ${graph.height / 2} Q ${graph.width / 2} ${graph.height / 2 - 60} ${graph.width - 80} ${graph.height / 2}`}
            fill="none"
            stroke={`url(#${spineId})`}
            strokeWidth={height === "fill" ? 48 : 32}
            strokeLinecap="round"
            opacity={0.4}
          />

          {renderEdges.map((edge) => (
            <GraphEdgeLine
              key={edge.id}
              edge={edge}
              nodeById={nodeById}
              active={highlight.edgeIds.has(edge.id)}
              dimmed={Boolean(highlightMemberId && !highlight.edgeIds.has(edge.id))}
              giant={height === "fill"}
              detail={detail}
            />
          ))}

          {enableZoom ? (
            <rect
              width={graph.width}
              height={graph.height}
              fill="transparent"
              onPointerDown={handleCanvasPointerDown}
            />
          ) : null}

          {renderNodes.map((node) => (
            <GraphNodeShape
              key={node.id}
              node={node}
              active={highlight.nodeIds.has(node.id)}
              dimmed={Boolean(highlightMemberId && !highlight.nodeIds.has(node.id))}
              onSelect={canvasMode === "select" ? onSelectNode : undefined}
              giant={height === "fill"}
              glowId={detail === "full" ? `${gradientIdPrefix}-glow` : undefined}
              interactive={enableZoom && canvasMode === "select"}
              detail={detail}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  title,
  label
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  label: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
        active
          ? "border-amber-400/50 bg-amber-500/25 text-amber-100"
          : "border-white/15 bg-black/75 text-white/85 hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}

function ZoomBtn({
  label,
  onClick,
  title
}: {
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-black/75 text-sm text-white/85 hover:bg-white/15"
    >
      {label}
    </button>
  );
}

function GraphEdgeLine({
  edge,
  nodeById,
  active,
  dimmed,
  giant,
  detail
}: {
  edge: GraphEdge;
  nodeById: Map<string, GraphNode>;
  active: boolean;
  dimmed: boolean;
  giant?: boolean;
  detail: GraphDetailLevel;
}) {
  const from = nodeById.get(edge.from);
  const to = nodeById.get(edge.to);
  if (!from || !to) return null;

  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - (giant ? 50 : 36);
  const thin = detail !== "full";
  const isSpoke =
    edge.id.startsWith("osm-") ||
    edge.id.startsWith("land-osm-") ||
    edge.id.startsWith("corridor-") ||
    edge.id.startsWith("hub-spoke-");
  const pathD = isSpoke && !active
    ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  const spokeOpacity = edge.id.startsWith("hub-spoke-") && !active ? 0.14 : undefined;

  return (
    <g pointerEvents="none">
      <path
        d={pathD}
        fill="none"
        stroke={active ? "#fbbf24" : "#ffffff28"}
        strokeWidth={active ? (giant ? 3 : 2) : thin ? 0.75 : giant ? 1.5 : 1}
        strokeDasharray={active || thin || isSpoke ? undefined : "6 5"}
        opacity={dimmed ? 0.1 : spokeOpacity ?? (active ? 0.92 : thin ? 0.28 : 0.38)}
        vectorEffect="non-scaling-stroke"
      />
      {active && edge.label && giant && detail === "full" ? (
        <text x={mx} y={my - 8} textAnchor="middle" fill="#fbbf2488" fontSize={11}>
          {edge.label}
        </text>
      ) : null}
    </g>
  );
}

function GraphNodeShape({
  node,
  active,
  dimmed,
  onSelect,
  giant,
  glowId,
  interactive,
  detail
}: {
  node: GraphNode;
  active: boolean;
  dimmed: boolean;
  onSelect?: (id: string) => void;
  giant?: boolean;
  glowId?: string;
  interactive?: boolean;
  detail: GraphDetailLevel;
}) {
  const scale = giant ? 1.35 : 1;
  const isOsm = node.id.startsWith("osm-") || node.kind === "osm";
  const simplified = detail === "overview" || (detail === "medium" && isOsm && !giant);
  const r = simplified
    ? isOsm
      ? 5
      : node.kind === "airport"
        ? 14
        : node.kind === "land"
          ? 10
          : 7
    : (node.kind === "airport" ? 24 : node.kind === "land" ? 18 : isOsm ? 14 : 11) * scale;
  const opacity = dimmed ? 0.22 : active ? 1 : 0.58;
  const showLabel =
    detail === "full" ||
    (detail === "medium" && !isOsm) ||
    (giant && isOsm && detail !== "overview") ||
    (giant && isOsm && active);
  const showSublabel =
    (detail === "full" || (giant && isOsm && detail === "medium")) &&
    !simplified &&
    isOsm &&
    Boolean(node.sublabel) &&
    !isRawOsmRef(node.label);

  const labelText =
    isRawOsmRef(node.label) && node.sublabel
      ? node.sublabel.replace("/", " · ").replace(/_/g, " ")
      : node.label;

  return (
    <g
      data-graph-node=""
      opacity={opacity}
      style={{ cursor: interactive && onSelect ? "pointer" : undefined, pointerEvents: interactive ? "all" : "none" }}
      onClick={() => onSelect?.(node.id)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(node.id)}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      filter={active && glowId ? `url(#${glowId})` : undefined}
    >
      {active && !simplified ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + (giant ? 14 : 10)}
          fill="none"
          stroke={node.color}
          strokeWidth={giant ? 2.5 : 2}
          opacity={0.55}
        />
      ) : null}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={node.color}
        fillOpacity={node.kind === "infra" && !isOsm ? 0.45 : 0.92}
        stroke={active && !simplified ? "#fff" : node.color}
        strokeWidth={active && !simplified ? (giant ? 2.5 : 2) : 1}
      />
      {showLabel ? (
        <text
          x={node.x}
          y={node.y + r + (giant ? 18 : 15)}
          textAnchor="middle"
          fill={active ? "#fff" : "#ffffffaa"}
          fontSize={giant ? (node.kind === "airport" ? 16 : 12) : node.kind === "airport" ? 13 : 10}
          fontWeight={active ? 700 : 500}
          pointerEvents="none"
        >
          {labelText.length > (giant ? 28 : 22) ? `${labelText.slice(0, giant ? 26 : 20)}…` : labelText}
        </text>
      ) : null}
      {showSublabel && node.sublabel && giant ? (
        <text
          x={node.x}
          y={node.y + r + (giant ? 34 : 26)}
          textAnchor="middle"
          fill="#ffffff55"
          fontSize={10}
          pointerEvents="none"
        >
          {node.sublabel.length > 44 ? `${node.sublabel.slice(0, 42)}…` : node.sublabel}
        </text>
      ) : null}
    </g>
  );
}

export function MatchingGraphLegend({ giant }: { giant?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 text-white/50 ${giant ? "text-xs" : "text-[10px]"}`}>
      <LegendDot color="#0ea5e9" label="Airport hub" />
      <LegendDot color="#10b981" label="Land anchor" />
      <LegendDot color="#f59e0b" label="Mitglied" />
      <LegendDot color="#fbbf24" label="OSM asset" />
      <LegendDot color="#a3e635" label="Infra layer" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
