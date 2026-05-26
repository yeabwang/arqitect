"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type {
  CanvasNodeColor,
  CanvasNodeShape,
  CanvasNode as CanvasNodeType,
} from "@/types/canvas";

const HANDLE_SIDES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

interface ShapeBodyProps {
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
}

// CSS-bordered shapes (rectangle/circle/pill) vs inline-SVG shapes
// (diamond/hexagon/cylinder) per ui-context. Each fills the node box so the
// dropped node keeps its footprint and silhouette.
function ShapeBody({ shape, color }: ShapeBodyProps) {
  if (shape === "diamond" || shape === "hexagon" || shape === "cylinder") {
    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {shape === "diamond" ? (
          <polygon
            points="50,1 99,50 50,99 1,50"
            fill={color.fill}
            stroke={color.text}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shape === "hexagon" ? (
          <polygon
            points="25,2 75,2 99,50 75,98 25,98 1,50"
            fill={color.fill}
            stroke={color.text}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shape === "cylinder" ? (
          <>
            <path
              d="M1,14 L1,86 A49,13 0 0 0 99,86 L99,14"
              fill={color.fill}
              stroke={color.text}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              cx={50}
              cy={14}
              rx={49}
              ry={13}
              fill={color.fill}
              stroke={color.text}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </svg>
    );
  }

  const radiusClass =
    shape === "circle" || shape === "pill" ? "rounded-full" : "rounded-xl";

  return (
    <div
      className={`absolute inset-0 border ${radiusClass}`}
      style={{ backgroundColor: color.fill, borderColor: color.text }}
    />
  );
}

// Renderer for the custom canvas node type. Draws the shape-specific silhouette
// with the label centered and connection handles on all four sides.
export function CanvasNode({ data }: NodeProps<CanvasNodeType>) {
  return (
    <div className="relative h-full w-full">
      <ShapeBody shape={data.shape} color={data.color} />

      <div
        className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm"
        style={{ color: data.color.text }}
      >
        <span className="break-words">{data.label}</span>
      </div>

      {HANDLE_SIDES.map(({ id, position }) => (
        <Handle key={id} id={id} type="source" position={position} />
      ))}
    </div>
  );
}
