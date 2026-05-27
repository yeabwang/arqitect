"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { shallow } from "@liveblocks/react";
import { useViewport } from "@xyflow/react";
import { Loader2 } from "lucide-react";

const DEFAULT_CURSOR_COLOR = "#00c8d4";

export function PresenceCursors() {
  const viewport = useViewport();

  const others = useOthers(
    (connections) =>
      connections.map((other) => ({
        connectionId: other.connectionId,
        cursorX: other.presence.cursor?.x ?? null,
        cursorY: other.presence.cursor?.y ?? null,
        thinking: other.presence.thinking === true,
        name: other.info?.name ?? "Collaborator",
        color:
          other.info?.cursorColor ?? other.info?.color ?? DEFAULT_CURSOR_COLOR,
      })),
    shallow
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {others.map((other) => {
        if (other.cursorX === null || other.cursorY === null) {
          return null;
        }
        const screenX = other.cursorX * viewport.zoom + viewport.x;
        const screenY = other.cursorY * viewport.zoom + viewport.y;
        return (
          <div
            key={other.connectionId}
            className="absolute top-0 left-0 will-change-transform"
            style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={other.color}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="1"
              className="drop-shadow"
              aria-hidden
            >
              <path d="M5.5 3.21V20.79c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z" />
            </svg>
            <span
              className="absolute top-4 left-4 flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow"
              style={{ backgroundColor: other.color }}
            >
              {other.thinking ? (
                <Loader2
                  className="h-3 w-3 animate-spin"
                  aria-label="Working with Ghost AI"
                />
              ) : null}
              {other.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
