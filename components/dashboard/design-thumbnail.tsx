interface DesignThumbnailProps {
  seed: string;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function DesignThumbnail({ seed }: DesignThumbnailProps) {
  const h = hashSeed(seed);
  const nodeCount = 3 + (h % 3);
  const nodes: { x: number; y: number; w: number; h: number; kind: number }[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const local = (h >> (i * 3)) & 0xff;
    const x = 24 + ((local * 7) % 200);
    const y = 24 + ((local * 11) % 90);
    const w = 36 + ((local * 5) % 24);
    const ht = 22 + ((local * 3) % 12);
    nodes.push({ x, y, w, h: ht, kind: local % 3 });
  }
  const edges: [number, number][] = [];
  for (let i = 0; i + 1 < nodes.length; i++) {
    edges.push([i, i + 1]);
  }
  if (nodes.length >= 3) edges.push([0, 2]);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl border-b border-border-faint bg-bg-canvas">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <svg
        viewBox="0 0 260 150"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {edges.map(([a, b], i) => {
          const A = nodes[a];
          const B = nodes[b];
          if (!A || !B) return null;
          const x1 = A.x + A.w / 2;
          const y1 = A.y + A.h / 2;
          const x2 = B.x + B.w / 2;
          const y2 = B.y + B.h / 2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--canvas-edge-faint)"
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {nodes.map((n, i) => {
          if (n.kind === 0) {
            return (
              <rect
                key={i}
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={3}
                fill="var(--node-neutral-fill)"
                stroke="var(--canvas-node-stroke)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
            );
          }
          if (n.kind === 1) {
            return (
              <rect
                key={i}
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={n.h / 2}
                fill="var(--node-blue-fill)"
                stroke="var(--node-blue-stroke)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
            );
          }
          return (
            <ellipse
              key={i}
              cx={n.x + n.w / 2}
              cy={n.y + n.h / 2}
              rx={n.w / 2}
              ry={n.h / 2}
              fill="var(--node-green-fill)"
              stroke="var(--node-green-stroke)"
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}
