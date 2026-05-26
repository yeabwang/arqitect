import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type AiStatusPhase =
  | "starting"
  | "thinking"
  | "applying"
  | "complete"
  | "error";

export type AiStatusEvent = {
  type: "ai:status";
  runId: string;
  phase: AiStatusPhase;
  message: string;
};

export type AiPresenceEvent = {
  type: "ai:presence";
  runId: string;
  cursor: { x: number; y: number } | null;
  thinking: boolean;
};

export type AiRoomEvent = AiStatusEvent | AiPresenceEvent;

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatarUrl: string;
        color: string;
        cursorColor: string;
      };
    };

    RoomEvent: AiRoomEvent;

    ThreadMetadata: Record<string, never>;

    RoomInfo: Record<string, never>;
  }
}

export {};
