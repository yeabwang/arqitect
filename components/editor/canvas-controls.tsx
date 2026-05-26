"use client";

import type { ReactNode } from "react";
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { ZOOM_ANIMATION_DURATION } from "@/hooks/useKeyboardShortcuts";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface CanvasControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// Floating pill control bar at the bottom-left of the canvas: a zoom group
// (out / fit / in) wired to the React Flow instance and a history group
// (undo / redo) wired to Liveblocks history via the supplied handlers.
export function CanvasControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow<CanvasNode, CanvasEdge>();

  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-10">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-default bg-bg-elevated/90 p-1.5 shadow-lg backdrop-blur">
        <ControlButton
          label="Zoom out"
          onClick={() => void zoomOut({ duration: ZOOM_ANIMATION_DURATION })}
        >
          <Minus className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label="Fit view"
          onClick={() => void fitView({ duration: ZOOM_ANIMATION_DURATION })}
        >
          <Maximize className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label="Zoom in"
          onClick={() => void zoomIn({ duration: ZOOM_ANIMATION_DURATION })}
        >
          <Plus className="h-4 w-4" />
        </ControlButton>

        <div className="mx-1 h-5 w-px bg-border-default" />

        <ControlButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </ControlButton>
      </div>
    </div>
  );
}
