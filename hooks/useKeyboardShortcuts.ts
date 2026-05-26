"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

// Shared duration so the control-bar buttons and the keyboard shortcuts animate
// zoom transitions identically.
export const ZOOM_ANIMATION_DURATION = 200;

interface KeyboardShortcutHandlers {
  // Only the zoom helpers are needed off the React Flow instance.
  reactFlow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onSelectAll: () => void;
}

// Skip shortcuts while the user is typing so editing a node/edge label or any
// form field isn't hijacked by zoom/undo keys.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// A live text selection means the user is copying real text, so leave the
// native clipboard alone instead of copying canvas nodes.
function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return !!selection && !selection.isCollapsed && selection.toString().length > 0;
}

// Canvas keyboard shortcuts wired to the React Flow instance (zoom) and the
// supplied history handlers (undo/redo). Listens on window so shortcuts work
// regardless of canvas focus.
export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onSelectAll,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      if (mod && key === "y") {
        event.preventDefault();
        onRedo();
        return;
      }

      if (mod && key === "c") {
        // Defer to the browser when the user is copying actual text.
        if (hasTextSelection()) {
          return;
        }
        event.preventDefault();
        onCopy();
        return;
      }

      if (mod && key === "v") {
        event.preventDefault();
        onPaste();
        return;
      }

      if (mod && key === "x") {
        // Defer to the browser when the user is cutting actual text.
        if (hasTextSelection()) {
          return;
        }
        event.preventDefault();
        onCut();
        return;
      }

      if (mod && key === "a") {
        event.preventDefault();
        onSelectAll();
        return;
      }

      // Remaining shortcuts are unmodified zoom keys.
      if (mod) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: ZOOM_ANIMATION_DURATION });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: ZOOM_ANIMATION_DURATION });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlow, onUndo, onRedo, onCopy, onPaste, onCut, onSelectAll]);
}
