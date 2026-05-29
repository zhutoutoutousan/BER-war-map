"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CorridorGraph, GraphViewport } from "@/lib/member-asset-graph";
import {
  graphFullViewport,
  graphViewportForNodes,
  normalizeViewport,
  panViewport,
  viewportToViewBox,
  zoomViewport
} from "@/lib/member-asset-graph";
import { detailLevelForZoom } from "@/lib/graph-view-cull";
import {
  buildRenderSnapshot,
  computeHighlightSets,
  hitTestNode,
  labelPolicy,
  type GraphRenderSnapshot
} from "@/lib/graph-render-snapshot";
import {
  EDGE_MODE_LABELS,
  selectDisplayEdges,
  type EdgeDisplayMode,
  type ScoredDisplayEdge
} from "@/lib/graph-edge-filter";
import { mgTrace, mgTraceBegin, mgTracePerf, mgTraceWarn } from "@/lib/matching-graph-trace";

type Props = {
  graph: CorridorGraph;
  highlightMemberId: string | null;
  onSelectNode?: (nodeId: string) => void;
  className?: string;
  fitMode?: "all" | "focus";
  fitRevision?: string;
  /** Precomputed highlight from parent (optional); memberId drives fast path */
  highlightNodeIds?: Set<string>;
};

function zoomPercent(full: GraphViewport, current: GraphViewport): number {
  return Math.min(400, Math.max(25, Math.round((full.width / current.width) * 100)));
}

function screenToGraph(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewport: GraphViewport
): { x: number; y: number } {
  const sx = (clientX - rect.left) / rect.width;
  const sy = (clientY - rect.top) / rect.height;
  return {
    x: viewport.x + sx * viewport.width,
    y: viewport.y + sy * viewport.height
  };
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  snapshot: GraphRenderSnapshot,
  displayEdges: ScoredDisplayEdge[],
  graph: CorridorGraph,
  viewport: GraphViewport,
  cssW: number,
  cssH: number,
  zoomPct: number,
  highlightMemberId: string | null,
  highlight: {
    activeNodes: Uint8Array | null;
    activeEdges: Uint8Array | null;
    dim: boolean;
  }
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const scaleX = cssW / viewport.width;
  const scaleY = cssH / viewport.height;
  const detail = detailLevelForZoom(zoomPct);
  const labels = labelPolicy(detail, zoomPct);
  const dim = highlight.dim;

  ctx.save();
  ctx.translate(-viewport.x * scaleX, -viewport.y * scaleY);
  ctx.scale(scaleX, scaleY);

  const grd = ctx.createLinearGradient(0, 0, 0, graph.height);
  grd.addColorStop(0, "#0c1929");
  grd.addColorStop(1, "#060a10");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, graph.width, graph.height);

  const spine = ctx.createLinearGradient(80, 0, graph.width - 80, 0);
  spine.addColorStop(0, "rgba(56,189,248,0.35)");
  spine.addColorStop(0.5, "rgba(16,185,129,0.45)");
  spine.addColorStop(1, "rgba(245,158,11,0.35)");
  ctx.strokeStyle = spine;
  ctx.lineWidth = 48;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(80, graph.height / 2);
  ctx.quadraticCurveTo(graph.width / 2, graph.height / 2 - 60, graph.width - 80, graph.height / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.lineCap = "round";
  for (const e of displayEdges) {
    const ei = e.graphIndex;
    const active =
      !highlight.activeEdges || ei < 0 || highlight.activeEdges[ei] === 1;
    const faded = dim && !active;

    ctx.beginPath();
    ctx.moveTo(e.x1, e.y1);
    ctx.lineTo(e.x2, e.y2);

    if (active) {
      ctx.strokeStyle = "rgba(251,191,36,0.92)";
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 1;
    } else if (e.isHubSpoke) {
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.globalAlpha = faded ? 0.05 : 0.12;
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.globalAlpha = faded ? 0.07 : 0.32;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const nodeIdx = new Map(graph.nodes.map((n, i) => [n.id, i]));

  for (const n of snapshot.nodes) {
    const ni = nodeIdx.get(n.id) ?? -1;
    const active =
      !highlight.activeNodes || ni < 0 || highlight.activeNodes[ni] === 1;
    const faded = dim && !active;
    const r = detail === "overview" && n.isOsm ? 5 : n.isOsm && detail === "medium" ? 7 : n.r;

    ctx.globalAlpha = faded ? 0.2 : active ? 1 : 0.55;
    if (active) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 12, 0, Math.PI * 2);
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = n.color;
    ctx.globalAlpha = faded ? 0.25 : n.kind === "infra" && !n.isOsm ? 0.45 : 0.9;
    ctx.fill();
    if (active) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    const showLabel =
      (labels.members && !n.isOsm) || (labels.osm && n.isOsm && !/^((node|way|relation)\/)/i.test(n.label));
    if (showLabel) {
      ctx.globalAlpha = faded ? 0.35 : active ? 1 : 0.7;
      ctx.fillStyle = active ? "#fff" : "rgba(255,255,255,0.65)";
      ctx.font = `${active ? 700 : 500} ${n.kind === "airport" ? 16 : 11}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      const text = n.label.length > 24 ? `${n.label.slice(0, 22)}…` : n.label;
      ctx.fillText(text, n.x, n.y + r + 16);
      if (labels.sublabels && n.sublabel && active) {
        ctx.font = "10px system-ui,sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText(
          n.sublabel.length > 40 ? `${n.sublabel.slice(0, 38)}…` : n.sublabel,
          n.x,
          n.y + r + 30
        );
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function MatchingGraphRaster({
  graph,
  highlightMemberId,
  onSelectNode,
  className = "",
  fitMode = "all",
  fitRevision = ""
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef(graph);
  const viewportRef = useRef<GraphViewport>(graphFullViewport(graph, 40));
  const aspectRef = useRef(16 / 9);
  const panRef = useRef<{ x: number; y: number; vp: GraphViewport } | null>(null);
  const rafDraw = useRef(0);
  const rafVp = useRef(0);
  const lastFitKey = useRef("");

  graphRef.current = graph;

  const snapshot = useMemo(() => {
    const end = mgTraceBegin("snapshot", "buildRenderSnapshot");
    const s = buildRenderSnapshot(graph, true);
    end();
    mgTrace("snapshot", "built", {
      nodes: s.nodes.length,
      edges: s.edges.length
    });
    return s;
  }, [graph]);

  const highlightArrays = useMemo(() => {
    const end = mgTraceBegin("highlight", "computeHighlightSets");
    const h = computeHighlightSets(graph, highlightMemberId);
    end();
    return h;
  }, [graph, highlightMemberId]);

  const [viewport, setViewport] = useState<GraphViewport>(() => graphFullViewport(graph, 40));
  const [zoomPct, setZoomPct] = useState(100);
  const [canvasMode, setCanvasMode] = useState<"select" | "pan">("select");
  const [edgeMode, setEdgeMode] = useState<EdgeDisplayMode>("key");
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const displayEdges = useMemo(() => {
    const end = mgTraceBegin("edges", `selectDisplayEdges:${edgeMode}`);
    const list = selectDisplayEdges({
      graph,
      renderEdges: snapshot.edges,
      nodes: snapshot.nodes,
      nodeIndex: snapshot.nodeIndex,
      mode: edgeMode,
      focusMemberId: highlightMemberId,
      zoomPct
    });
    end();
    mgTrace("edges", "filtered", {
      mode: edgeMode,
      shown: list.length,
      total: snapshot.edges.length,
      focus: highlightMemberId
    });
    return list;
  }, [graph, snapshot, edgeMode, highlightMemberId, zoomPct]);

  viewportRef.current = viewport;

  const fitKey = `${fitMode}|${highlightMemberId ?? ""}|${fitRevision}`;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const t0 = performance.now();
    const rect = el.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    drawScene(
      ctx,
      snapshot,
      displayEdges,
      graphRef.current,
      viewportRef.current,
      cssW,
      cssH,
      zoomPct,
      highlightMemberId,
      highlightArrays
    );
    const ms = performance.now() - t0;
    if (ms > 24) {
      mgTraceWarn("paint", "slow frame", {
        ms: Math.round(ms),
        nodes: snapshot.nodes.length,
        edges: displayEdges.length,
        zoomPct,
        edgeMode
      });
    }
  }, [snapshot, displayEdges, zoomPct, highlightMemberId, highlightArrays, edgeMode]);

  const schedulePaint = useCallback(() => {
    if (rafDraw.current) return;
    rafDraw.current = requestAnimationFrame(() => {
      rafDraw.current = 0;
      paint();
    });
  }, [paint]);

  const flushViewport = useCallback((vp: GraphViewport) => {
    const next = normalizeViewport(vp, graphRef.current, aspectRef.current);
    viewportRef.current = next;
    setViewport(next);
    setZoomPct(zoomPercent(graphFullViewport(graphRef.current, 40), next));
    schedulePaint();
    return next;
  }, [schedulePaint]);

  const scheduleViewport = useCallback(
    (vp: GraphViewport) => {
      viewportRef.current = normalizeViewport(vp, graphRef.current, aspectRef.current);
      if (rafVp.current) cancelAnimationFrame(rafVp.current);
      rafVp.current = requestAnimationFrame(() => {
        rafVp.current = 0;
        const next = viewportRef.current;
        setViewport(next);
        setZoomPct(zoomPercent(graphFullViewport(graphRef.current, 40), next));
        schedulePaint();
      });
    },
    [schedulePaint]
  );

  useEffect(() => {
    schedulePaint();
  }, [schedulePaint, displayEdges, viewport, graph, highlightMemberId, highlightArrays, edgeMode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      setSize({ w: width, h: height });
      aspectRef.current = width / height;
      flushViewport(viewportRef.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [flushViewport]);

  useEffect(() => {
    if (lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;
    const end = mgTraceBegin("fit", `viewport:${fitMode}`);
    let vp = graphFullViewport(graph, 40);
    if (fitMode === "focus" && highlightMemberId) {
      const focusNodes = graph.nodes.filter((n) => {
        if (n.id === `member-${highlightMemberId}`) return true;
        return graph.edges.some(
          (e) => e.memberIds.includes(highlightMemberId) && (e.from === n.id || e.to === n.id)
        );
      });
      if (focusNodes.length) vp = graphViewportForNodes(focusNodes, graph, 140);
    } else if (graph.nodes.length) {
      vp = graphViewportForNodes(graph.nodes, graph, 160);
    }
    mgTrace("fit", "apply", {
      fitMode,
      focus: highlightMemberId,
      x: Math.round(vp.x),
      y: Math.round(vp.y),
      w: Math.round(vp.width),
      h: Math.round(vp.height)
    });
    flushViewport(vp);
    end();
  }, [fitKey, fitMode, highlightMemberId, graph, flushViewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const v = viewportRef.current;
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const mx = v.x + ((e.clientX - rect.left) / rect.width) * v.width;
      const my = v.y + ((e.clientY - rect.top) / rect.height) * v.height;
      scheduleViewport(zoomViewport(v, factor, mx, my));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scheduleViewport]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pan = panRef.current;
      if (!pan) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - pan.x) / rect.width) * pan.vp.width;
      const dy = ((e.clientY - pan.y) / rect.height) * pan.vp.height;
      scheduleViewport(panViewport(pan.vp, -dx, -dy, graphRef.current));
    };
    const endPan = () => {
      panRef.current = null;
      setIsDragging(false);
      flushViewport(viewportRef.current);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endPan);
    window.addEventListener("pointercancel", endPan);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endPan);
      window.removeEventListener("pointercancel", endPan);
    };
  }, [scheduleViewport, flushViewport]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const el = containerRef.current;
      if (!el) return;

      if (canvasMode === "select" && onSelectNode) {
        const rect = el.getBoundingClientRect();
        const { x, y } = screenToGraph(e.clientX, e.clientY, rect, viewportRef.current);
        const t0 = performance.now();
        const hit = hitTestNode(snapshot, x, y);
        mgTrace("click", hit ? "hit" : "miss", {
          ms: Math.round(performance.now() - t0),
          graphX: Math.round(x),
          graphY: Math.round(y),
          nodeId: hit
        });
        if (hit) {
          e.preventDefault();
          onSelectNode(hit);
          return;
        }
      }

      panRef.current = { x: e.clientX, y: e.clientY, vp: viewportRef.current };
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canvasMode, onSelectNode, snapshot]
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const v = viewportRef.current;
      flushViewport(zoomViewport(v, factor, v.x + v.width / 2, v.y + v.height / 2));
    },
    [flushViewport]
  );

  const cursor =
    canvasMode === "pan" ? (isDragging ? "grabbing" : "grab") : isDragging ? "grabbing" : "default";

  return (
    <div className={`relative h-full min-h-0 ${className}`}>
      <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-col gap-1">
        <div className="flex gap-1">
          <ToolBtn active={canvasMode === "select"} onClick={() => setCanvasMode("select")} label="↖" title="Select" />
          <ToolBtn active={canvasMode === "pan"} onClick={() => setCanvasMode("pan")} label="✥" title="Pan" />
        </div>
        <div className="flex flex-col gap-0.5 rounded-md bg-black/75 p-0.5">
          {(["key", "matching", "all"] as EdgeDisplayMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              title={`Edge filter: ${EDGE_MODE_LABELS[mode]}`}
              onClick={() => setEdgeMode(mode)}
              className={`rounded px-1.5 py-0.5 text-left text-[9px] ${
                edgeMode === mode
                  ? "bg-amber-500/30 text-amber-100"
                  : "text-white/55 hover:bg-white/10"
              }`}
            >
              {EDGE_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <ToolBtn label="+" onClick={() => zoomBy(0.85)} title="Zoom in" />
        <span className="rounded-md bg-black/70 px-2 py-0.5 text-center text-[10px] text-white/70">{zoomPct}%</span>
        <span
          className="rounded-md bg-black/60 px-1.5 py-0.5 text-center text-[9px] leading-tight text-emerald-300/80"
          title={`${displayEdges.length} edges drawn of ${snapshot.edges.length} total`}
        >
          {snapshot.nodes.length}n · {displayEdges.length}/{snapshot.edges.length}e
        </span>
        <ToolBtn label="−" onClick={() => zoomBy(1.15)} title="Zoom out" />
        <ToolBtn
          label="⊡"
          onClick={() => {
            lastFitKey.current = "";
            flushViewport(graphFullViewport(graphRef.current, 40));
          }}
          title="Fit all"
        />
        {highlightMemberId ? (
          <ToolBtn
            label="◎"
            onClick={() => {
              lastFitKey.current = "";
              const focusNodes = graphRef.current.nodes.filter((n) => {
                if (n.id === `member-${highlightMemberId}`) return true;
                return graphRef.current.edges.some(
                  (e) =>
                    e.memberIds.includes(highlightMemberId) &&
                    (e.from === n.id || e.to === n.id)
                );
              });
              flushViewport(
                focusNodes.length
                  ? graphViewportForNodes(focusNodes, graphRef.current, 140)
                  : graphFullViewport(graphRef.current, 40)
              );
            }}
            title="Fit focus"
          />
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden rounded-lg border border-white/10 bg-[#060a10]"
        data-testid="matching-graph-canvas"
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full touch-none"
          style={{ cursor, width: size.w, height: size.h }}
          onPointerDown={handlePointerDown}
          aria-label="Matching map canvas"
        />
      </div>
    </div>
  );
}

function ToolBtn({
  label,
  onClick,
  title,
  active
}: {
  label: string;
  onClick: () => void;
  title: string;
  active?: boolean;
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
