"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import { ShapeSilhouette } from "@/components/editor/shape-silhouette";
import { cn } from "@/lib/utils";
import {
  MIN_NODE_SIZE,
  NODE_COLORS,
  type CanvasNode as CanvasNodeType,
} from "@/types/canvas";

const HANDLE_SIDES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

const LABEL_PLACEHOLDER = "Add label";

// Renderer for the custom canvas node type. Draws the shape-specific silhouette
// with the label centered and connection handles on all four sides. Selected
// nodes gain resize handles, and double-clicking the label opens inline editing.
// Resize and label updates both flow through React Flow's change pipeline, which
// is wired to the Liveblocks-synced node state.
export function CanvasNode({ id, data, selected }: NodeProps<CanvasNodeType>) {
  const { updateNodeData } = useReactFlow<CanvasNodeType>();
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and select the existing text when editing opens so a quick edit can
  // overwrite the label immediately.
  useEffect(() => {
    if (!editing) {
      return;
    }
    const el = textareaRef.current;
    el?.focus();
    el?.select();
  }, [editing]);

  function openEditing(event: MouseEvent<HTMLDivElement>) {
    // Keep the double-click from reaching the pane and triggering zoom.
    event.stopPropagation();
    setEditing(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
    }
  }

  return (
    <div className="relative h-full w-full">
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={10}
        // nodrag/nopan keep swatch clicks from moving the node or panning.
        className="nodrag nopan flex items-center gap-1 rounded-xl border border-border-default bg-bg-elevated/90 p-1 shadow-lg backdrop-blur"
      >
        {NODE_COLORS.map((pair) => {
          const active =
            pair.fill === data.color.fill && pair.text === data.color.text;
          return (
            <button
              key={pair.fill + pair.text}
              type="button"
              aria-label={`Set node color ${pair.text}`}
              aria-pressed={active}
              onClick={(event) => {
                event.stopPropagation();
                updateNodeData(id, { color: pair });
              }}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border border-border-subtle transition-shadow hover:shadow-[0_0_8px_1px_var(--swatch-glow)]",
                active && "ring-2 ring-text-primary ring-offset-1 ring-offset-bg-elevated",
              )}
              style={
                {
                  backgroundColor: pair.fill,
                  "--swatch-glow": pair.text,
                } as CSSProperties
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: pair.text }}
              />
            </button>
          );
        })}
      </NodeToolbar>

      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_SIZE.width}
        minHeight={MIN_NODE_SIZE.height}
        color="var(--border-subtle)"
        handleClassName="!h-2 !w-2 !rounded-sm !border-0 !bg-border-subtle"
        lineClassName="!border-border-subtle"
      />

      <ShapeSilhouette
        shape={data.shape}
        color={data.color}
        selected={selected}
      />

      <div
        className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm"
        style={{ color: data.color.text }}
        onDoubleClick={openEditing}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={data.label}
            onChange={(event) =>
              updateNodeData(id, { label: event.target.value })
            }
            onBlur={() => setEditing(false)}
            onKeyDown={handleKeyDown}
            placeholder={LABEL_PLACEHOLDER}
            rows={1}
            // nodrag/nopan keep text selection and clicks from moving the node
            // or panning the canvas while editing.
            className="nodrag nopan w-full resize-none border-0 bg-transparent text-center text-sm leading-snug outline-none placeholder:text-text-muted"
            style={{ color: data.color.text }}
          />
        ) : data.label ? (
          <span className="whitespace-pre-wrap break-words">{data.label}</span>
        ) : (
          <span className="break-words text-text-muted">{LABEL_PLACEHOLDER}</span>
        )}
      </div>

      {HANDLE_SIDES.map(({ id: handleId, position }) => (
        <Handle key={handleId} id={handleId} type="source" position={position} />
      ))}
    </div>
  );
}
