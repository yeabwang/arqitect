import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type CanvasNodeColor = (typeof NODE_COLORS)[number];
export type CanvasNodeShape = (typeof NODE_SHAPES)[number];

export const DEFAULT_NODE_COLOR: CanvasNodeColor = NODE_COLORS[0];

export interface CanvasNodeSize {
  width: number;
  height: number;
}

// Default footprint per shape: rectangles wider than tall, circles square,
// diamonds slightly larger so centered labels have room.
export const DEFAULT_NODE_SIZES: Record<CanvasNodeShape, CanvasNodeSize> = {
  rectangle: { width: 180, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 120, height: 120 },
  pill: { width: 180, height: 64 },
  cylinder: { width: 140, height: 100 },
  hexagon: { width: 160, height: 100 },
};

// Floor for node resizing so nodes never shrink past a usable footprint.
export const MIN_NODE_SIZE: CanvasNodeSize = { width: 80, height: 48 };

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: CanvasNodeColor;
  shape: CanvasNodeShape;
}

// Drag-and-drop contract between the shape panel and the canvas drop target.
export const SHAPE_DRAG_MIME = "application/ghost-shape" as const;

export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  size: CanvasNodeSize;
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdgeData = Record<string, unknown>;
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;
