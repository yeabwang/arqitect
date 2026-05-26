"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  EDGE_STROKE_COLOR,
  type CanvasEdge as CanvasEdgeType,
  type CanvasNode,
} from "@/types/canvas";

const LABEL_HINT = "Add label";

// Custom canvas edge: clean right-angle routing, a wide invisible hit path for
// easy hover/click without a thicker visible line, and inline label editing
// positioned at the path midpoint via EdgeLabelRenderer. Label updates flow
// through useReactFlow().updateEdgeData -> onEdgesChange, which is wired to the
// Liveblocks-synced edge state.
export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdgeType>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdgeType>();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Right-angle routing; labelX/labelY come straight from getSmoothStepPath.
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const label = data?.label ?? "";
  const active = hovered || selected;

  function startEditing(event: MouseEvent) {
    event.stopPropagation();
    setDraft(label);
    setEditing(true);
  }

  function commit() {
    if (!editing) {
      return;
    }
    updateEdgeData(id, { label: draft.trim() });
    setEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Spec: save on Enter or Escape (and on blur).
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      commit();
    }
  }

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={startEditing}
      >
        {/* Wide transparent path: easy hover/click target, thin visible line. */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={24}
          style={{ cursor: "pointer" }}
        />
        <path
          d={path}
          fill="none"
          markerEnd={markerEnd}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            stroke: EDGE_STROKE_COLOR,
            strokeWidth: 2,
            opacity: active ? 1 : 0.5,
            pointerEvents: "none",
            transition: "opacity 120ms ease",
          }}
        />
      </g>

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
        >
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={(event) => event.target.select()}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              onClick={(event) => event.stopPropagation()}
              placeholder={LABEL_HINT}
              className="nodrag nopan pointer-events-auto rounded-full border border-border-default bg-bg-elevated px-2 py-0.5 text-center text-xs text-text-primary outline-none placeholder:text-text-faint"
              style={{ width: `${Math.max(draft.length, LABEL_HINT.length) + 1}ch` }}
            />
          ) : label ? (
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={startEditing}
              className="nodrag nopan pointer-events-auto cursor-text rounded-full border border-border-default bg-bg-elevated/90 px-2 py-0.5 text-xs text-text-secondary backdrop-blur"
            >
              {label}
            </button>
          ) : selected ? (
            // Shown once the edge is clicked/selected. Solid canvas-colored
            // background masks the line so the hint reads as a break in the
            // edge: ----- Add label -----
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={startEditing}
              className="nodrag nopan pointer-events-auto cursor-text rounded-md bg-background px-2 py-0.5 text-xs text-text-faint"
            >
              {LABEL_HINT}
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
