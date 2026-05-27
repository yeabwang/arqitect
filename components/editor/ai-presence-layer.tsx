"use client";

import { useEffect, useRef, useState } from "react";
import { useEventListener } from "@liveblocks/react/suspense";
import { useViewport } from "@xyflow/react";
import { Bot } from "lucide-react";

const AI_NAME = "Ghost AI";
const AI_COLOR = "#8b82ff";
const PRESENCE_TIMEOUT_MS = 8_000;

interface AiPresenceState {
  cursor: { x: number; y: number } | null;
  thinking: boolean;
}

export function AiPresenceLayer() {
  const [state, setState] = useState<AiPresenceState>({
    cursor: null,
    thinking: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewport = useViewport();

  useEventListener(({ event }) => {
    if (event.type !== "ai:presence") {
      return;
    }
    setState({ cursor: event.cursor, thinking: event.thinking });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setState({ cursor: null, thinking: false });
    }, PRESENCE_TIMEOUT_MS);
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!state.thinking && !state.cursor) {
    return null;
  }

  const screen = state.cursor
    ? {
        x: state.cursor.x * viewport.zoom + viewport.x,
        y: state.cursor.y * viewport.zoom + viewport.y,
      }
    : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {screen ? (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: screen.x, top: screen.y }}
        >
          <div className="flex flex-col items-start gap-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={AI_COLOR}
              stroke={AI_COLOR}
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <path d="M5 3l14 9-7 1-3 7z" />
            </svg>
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow"
              style={{ backgroundColor: AI_COLOR }}
            >
              <Bot className="h-3 w-3" />
              {AI_NAME}
              {state.thinking ? (
                <span className="ml-1 opacity-80">thinking…</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="absolute right-3 top-14 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-white shadow"
          style={{ backgroundColor: AI_COLOR }}
        >
          <Bot className="h-3 w-3 animate-pulse" />
          {AI_NAME} thinking…
        </div>
      )}
    </div>
  );
}
