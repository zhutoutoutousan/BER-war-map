/** Corridor bbox — west → east (same as panorama graph). */
export const CORRIDOR_BBOX = {
  minLng: 13.34,
  maxLng: 13.58,
  minLat: 52.328,
  maxLat: 52.405
};

export function corridorLngToX(lng: number, width: number, pad: number): number {
  const t = (lng - CORRIDOR_BBOX.minLng) / (CORRIDOR_BBOX.maxLng - CORRIDOR_BBOX.minLng);
  return pad + t * (width - pad * 2);
}

export function corridorLatToY(lat: number, height: number, pad: number, lane = 0): number {
  const t = (lat - CORRIDOR_BBOX.minLat) / (CORRIDOR_BBOX.maxLat - CORRIDOR_BBOX.minLat);
  const base = pad + (1 - t) * (height - pad * 2);
  return base + lane * 24;
}

export type LayoutPoint = { id: string; x: number; y: number; radius: number };

/** Push overlapping nodes apart (keeps geographic meaning, reduces hairballs). */
export function spreadCollisions(points: LayoutPoint[], minGap = 56, passes = 10): void {
  if (points.length <= 1) return;
  const effectivePasses = points.length > 600 ? Math.min(passes, 5) : passes;
  const cellSize = Math.max(minGap * 2, 80);

  for (let p = 0; p < effectivePasses; p++) {
    const grid = new Map<string, number[]>();
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const cx = Math.floor(pt.x / cellSize);
      const cy = Math.floor(pt.y / cellSize);
      const key = `${cx},${cy}`;
      const bucket = grid.get(key);
      if (bucket) bucket.push(i);
      else grid.set(key, [i]);
    }

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const cx = Math.floor(a.x / cellSize);
      const cy = Math.floor(a.y / cellSize);

      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(`${gx},${gy}`);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            const b = points[j];
            const need = a.radius + b.radius + minGap;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy);
            if (d >= need || d < 0.001) continue;
            const push = (need - d) / 2;
            const ux = dx / d;
            const uy = dy / d;
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
    }
  }
}

export function clampToCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  pad: number
): { x: number; y: number } {
  return {
    x: Math.max(pad, Math.min(width - pad, x)),
    y: Math.max(pad, Math.min(height - pad, y))
  };
}

function nodeLayoutRadius(kind: string, isMultiMember?: boolean): number {
  if (kind === "osm") return isMultiMember ? 16 : 13;
  if (kind === "member") return 30;
  if (kind === "land") return 22;
  if (kind === "airport") return 26;
  return 14;
}

/**
 * Radial focus layout — member centre-left, OSM on an arc, no geographic stacking.
 */
export function layoutMemberFocusGraph(
  graph: { width: number; height: number; nodes: { id: string; kind: string; x: number; y: number; memberIds?: string[] }[] },
  memberId: string
): void {
  const { width, height, nodes } = graph;
  const pad = 100;
  const cx = width * 0.4;
  const cy = height * 0.5;
  const mid = `member-${memberId}`;

  const memberNode = nodes.find((n) => n.id === mid);
  if (!memberNode) return;

  const hub = nodes.find((n) => n.id === "hub-ber");
  if (hub) {
    hub.x = width * 0.1;
    hub.y = cy;
  }

  const lands = nodes.filter((n) => n.kind === "land");
  lands.forEach((n, i) => {
    const t = (i + 1) / (lands.length + 1);
    n.x = width * 0.2;
    n.y = pad + t * (height - pad * 2);
  });

  memberNode.x = cx;
  memberNode.y = cy;

  const peers = nodes.filter((n) => n.kind === "member" && n.id !== memberNode.id);
  peers.forEach((n, i) => {
    const spread = (i - (peers.length - 1) / 2) * 110;
    n.x = cx - 80 + spread;
    n.y = cy + 170;
  });

  const osms = nodes.filter((n) => n.kind === "osm");
  const radius = Math.min(520, 200 + osms.length * 5);
  osms.forEach((n, i) => {
    const span = Math.PI * 0.85;
    const start = -Math.PI / 2 - span / 2;
    const angle = start + (span * (i + 0.5)) / Math.max(osms.length, 1);
    n.x = cx + Math.cos(angle) * radius;
    n.y = cy + Math.sin(angle) * radius * 0.72;
  });

  const zones = nodes.filter((n) => n.kind === "infra" && n.id.startsWith("zone-"));
  zones.forEach((n, i) => {
    n.x = cx - 200 + i * 140;
    n.y = pad + 40;
  });

  const otherInfra = nodes.filter(
    (n) => n.kind === "infra" && !n.id.startsWith("zone-")
  );
  otherInfra.forEach((n, i) => {
    n.x = width * 0.55 + (i % 4) * 90;
    n.y = height - pad - 60 - Math.floor(i / 4) * 70;
  });

  const layout: LayoutPoint[] = nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    radius: nodeLayoutRadius(n.kind, (n.memberIds?.length ?? 0) > 1)
  }));

  spreadCollisions(layout, 72, 20);

  for (const pt of layout) {
    const n = nodes.find((node) => node.id === pt.id);
    if (!n) continue;
    const c = clampToCanvas(pt.x, pt.y, width, height, pad);
    n.x = c.x;
    n.y = c.y;
  }
}
