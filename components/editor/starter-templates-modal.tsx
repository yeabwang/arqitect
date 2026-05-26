"use client";

import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import {
  DEFAULT_NODE_SIZES,
  EDGE_STROKE_COLOR,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

// Padding (in template coordinate units) around the diagram bounds so nodes
// never touch the preview edge.
const PREVIEW_PADDING = 48;

interface PreviewNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
}

interface PreviewEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Trim a label so it roughly fits the node width at the given font size.
function fitLabel(label: string, width: number, fontSize: number): string {
  const max = Math.max(1, Math.floor(width / (fontSize * 0.58)));
  if (label.length <= max) {
    return label;
  }
  return `${label.slice(0, Math.max(1, max - 1))}…`;
}

// Render a single node as SVG primitives in template coordinate space. Strokes
// use non-scaling-stroke so they stay crisp at any preview scale.
function PreviewShape({ node }: { node: PreviewNode }) {
  const { x, y, width, height, shape, color, label } = node;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const fontSize = Math.min(16, Math.max(10, height * 0.26));

  const stroke = {
    fill: color.fill,
    stroke: color.text,
    strokeOpacity: 0.7,
    strokeWidth: 1.5,
    vectorEffect: "non-scaling-stroke" as const,
  };

  let body: ReactNode;
  switch (shape) {
    case "circle":
      body = <ellipse cx={cx} cy={cy} rx={width / 2} ry={height / 2} {...stroke} />;
      break;
    case "pill":
      body = (
        <rect x={x} y={y} width={width} height={height} rx={height / 2} {...stroke} />
      );
      break;
    case "diamond":
      body = (
        <polygon
          points={`${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`}
          {...stroke}
        />
      );
      break;
    case "hexagon": {
      const inset = width * 0.22;
      body = (
        <polygon
          points={`${x + inset},${y} ${x + width - inset},${y} ${x + width},${cy} ${x + width - inset},${y + height} ${x + inset},${y + height} ${x},${cy}`}
          {...stroke}
        />
      );
      break;
    }
    case "cylinder": {
      const ry = height * 0.14;
      body = (
        <>
          <path
            d={`M${x},${y + ry} L${x},${y + height - ry} A${width / 2},${ry} 0 0 0 ${x + width},${y + height - ry} L${x + width},${y + ry}`}
            {...stroke}
          />
          <ellipse cx={cx} cy={y + ry} rx={width / 2} ry={ry} {...stroke} />
        </>
      );
      break;
    }
    default:
      body = <rect x={x} y={y} width={width} height={height} rx={12} {...stroke} />;
  }

  return (
    <g>
      {body}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={500}
        fill={color.text}
      >
        {fitLabel(label, width, fontSize)}
      </text>
    </g>
  );
}

// Self-scaling diagram preview. Computes diagram bounds from node footprints and
// renders everything inside one SVG with a fitted viewBox, so it always fills
// the card width without clipping and needs no React Flow instance.
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges, viewBox } = useMemo(() => {
    const previewNodes: PreviewNode[] = template.nodes.map((item) => {
      const fallback = DEFAULT_NODE_SIZES[item.data.shape];
      return {
        id: item.id,
        x: item.position.x,
        y: item.position.y,
        width: Number(item.style?.width) || fallback.width,
        height: Number(item.style?.height) || fallback.height,
        label: item.data.label,
        shape: item.data.shape,
        color: item.data.color,
      };
    });

    const minX = Math.min(...previewNodes.map((n) => n.x));
    const minY = Math.min(...previewNodes.map((n) => n.y));
    const maxX = Math.max(...previewNodes.map((n) => n.x + n.width));
    const maxY = Math.max(...previewNodes.map((n) => n.y + n.height));

    const byId = new Map(previewNodes.map((n) => [n.id, n]));
    const previewEdges: PreviewEdge[] = template.edges
      .map((e) => {
        const source = byId.get(e.source);
        const target = byId.get(e.target);
        if (!source || !target) {
          return null;
        }
        return {
          id: e.id,
          x1: source.x + source.width / 2,
          y1: source.y + source.height / 2,
          x2: target.x + target.width / 2,
          y2: target.y + target.height / 2,
        };
      })
      .filter((e): e is PreviewEdge => e !== null);

    const vbX = minX - PREVIEW_PADDING;
    const vbY = minY - PREVIEW_PADDING;
    const vbW = maxX - minX + PREVIEW_PADDING * 2;
    const vbH = maxY - minY + PREVIEW_PADDING * 2;

    return {
      nodes: previewNodes,
      edges: previewEdges,
      viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`,
    };
  }, [template]);

  return (
    <div className="h-48 w-full overflow-hidden rounded-xl border border-border-subtle bg-background bg-[radial-gradient(var(--border-subtle)_1px,transparent_1px)] [background-size:16px_16px]">
      <svg
        className="h-full w-full"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {edges.map((e) => (
          <line
            key={e.id}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={EDGE_STROKE_COLOR}
            strokeOpacity={0.45}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {nodes.map((node) => (
          <PreviewShape key={node.id} node={node} />
        ))}
      </svg>
    </div>
  );
}

// Dialog presenting the starter template library as a scrollable grid of cards.
// Each card shows a diagram preview, name, description, and an import action
// that hands the selected template to the editor and closes the modal.
export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="flex h-[92vh] w-[96vw] max-w-[1280px] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[1280px]"
      >
        <div className="flex flex-col items-center gap-1.5 border-b border-border-default px-8 py-6 text-center">
          <DialogTitle className="text-xl font-semibold">
            Import templates
          </DialogTitle>
          <DialogDescription className="max-w-xl text-sm">
            Add a prebuilt diagram to your canvas. Templates are placed next to
            your existing work — nothing is replaced.
          </DialogDescription>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 gap-5 px-8 py-6 md:grid-cols-2 xl:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border-default bg-card transition-all hover:border-border-subtle hover:shadow-xl"
              >
                <div className="p-4 pb-0">
                  <TemplatePreview template={template} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="text-base font-semibold text-foreground">
                    {template.name}
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => handleImport(template)}
                  >
                    Add to canvas
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
