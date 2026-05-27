import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { AiFeedPayload } from "@/types/tasks";

export type AiPresenceEvent = {
  type: "ai:presence";
  runId: string;
  cursor: { x: number; y: number } | null;
  thinking: boolean;
};

export type AiRoomEvent = AiPresenceEvent;

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

    FeedMessageData: AiFeedPayload;
  }
}

export {};
