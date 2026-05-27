"use client";

import type { ReactNode } from "react";
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useReactFlow, useViewport } from "@xyflow/react";
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

// Floating pill control bar at the bottom-right of the canvas: history and
// navigation are close at hand without competing with the left creation rail.
export function CanvasControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow<CanvasNode, CanvasEdge>();
  const { zoom } = useViewport();
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-20">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border-default bg-bg-elevated/90 p-1.5 shadow-2xl backdrop-blur-md">
        <ControlButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </ControlButton>

        <div className="mx-1 h-5 w-px bg-border-default" />

        <ControlButton
          label="Zoom out"
          onClick={() => void zoomOut({ duration: ZOOM_ANIMATION_DURATION })}
        >
          <Minus className="h-4 w-4" />
        </ControlButton>
        <div
          className="flex h-9 min-w-14 items-center justify-center rounded-xl px-2 font-mono text-xs text-text-primary"
          aria-label={`Zoom ${zoomPercent}%`}
        >
          {zoomPercent}%
        </div>
        <ControlButton
          label="Zoom in"
          onClick={() => void zoomIn({ duration: ZOOM_ANIMATION_DURATION })}
        >
          <Plus className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label="Fit view"
          onClick={() => void fitView({ duration: ZOOM_ANIMATION_DURATION })}
        >
          <Maximize className="h-4 w-4" />
        </ControlButton>
      </div>
    </div>
  );
}
