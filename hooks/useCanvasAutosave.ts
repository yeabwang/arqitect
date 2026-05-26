"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 1500;

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCanvasAutosaveOptions): CanvasSaveStatus {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<string | null>(null);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Skip the very first run so the initial loaded state doesn't trigger a
    // redundant write back to blob storage.
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      lastSerializedRef.current = JSON.stringify({ nodes, edges });
      return;
    }

    const serialized = JSON.stringify({ nodes, edges });
    if (serialized === lastSerializedRef.current) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });
        if (!response.ok) {
          throw new Error(`Save failed with ${response.status}`);
        }
        lastSerializedRef.current = serialized;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [projectId, nodes, edges, enabled, debounceMs]);

  return status;
}
