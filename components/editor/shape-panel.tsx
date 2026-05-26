"use client";

import { useRef, type DragEvent } from "react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react";
import { ShapeSilhouette } from "@/components/editor/shape-silhouette";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZES,
  SHAPE_DRAG_MIME,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

interface ShapeButton {
  shape: CanvasNodeShape;
  label: string;
  Icon: LucideIcon;
}

const SHAPE_BUTTONS: ShapeButton[] = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

export function ShapePanel() {
  // One offscreen preview element per shape, used as the native drag image so
  // the ghost matches the shape and default size that will be dropped. The
  // browser snapshots it on dragstart, keeps it pinned to the cursor, and
  // discards it automatically on drop or cancel.
  const previewRefs = useRef<
    Partial<Record<CanvasNodeShape, HTMLDivElement | null>>
  >({});

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape,
  ) {
    const size = DEFAULT_NODE_SIZES[shape];
    const payload: ShapeDragPayload = { shape, size };
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";

    const preview = previewRefs.current[shape];
    if (preview) {
      event.dataTransfer.setDragImage(preview, size.width / 2, size.height / 2);
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border-default bg-bg-elevated/90 p-2 shadow-lg backdrop-blur">
        {SHAPE_BUTTONS.map(({ shape, label, Icon }) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, shape)}
            aria-label={`Drag ${label} onto the canvas`}
            title={label}
            className="flex h-10 w-10 cursor-grab items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary active:cursor-grabbing"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Offscreen ghost previews snapshotted by setDragImage on dragstart. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0"
      >
        {SHAPE_BUTTONS.map(({ shape }) => {
          const size = DEFAULT_NODE_SIZES[shape];
          return (
            <div
              key={shape}
              ref={(el) => {
                previewRefs.current[shape] = el;
              }}
              className="relative opacity-80"
              style={{ width: size.width, height: size.height }}
            >
              <ShapeSilhouette shape={shape} color={DEFAULT_NODE_COLOR} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
